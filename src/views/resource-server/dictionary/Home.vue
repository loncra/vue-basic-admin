<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  markRaw,
  onActivated,
  onMounted,
  ref
} from "vue";
import {DictionaryTypeService} from "@/apis/resource-server/dictionaryTypeService.ts";
import {findAllTreeNodes, findFirstTreeNode, requireNonNullOrUndefined, unmergeTree} from "@/utils";
import {App, Input, type MenuProps, Select, type TableProps} from "antdv-next";
import {DataDictionaryService} from "@/apis/resource-server/dataDictionaryService.ts";
import type {PageRequest, RestResult, TreeSortMetadata} from "@/types/apis";
import type {EnumBucketsResponseBody} from "@/types/apis/resource-server/resourceDomain.ts";
import {ResourceServerService} from "@/apis";
import type {
  DictionaryTypeEntity,
  DictionaryTypeSavePayload
} from "@/types/apis/resource-server/dictionaryTypeDomain.ts";
import {getEnumName} from "@/utils/commonUtils.ts";
import {createIcon} from "@/utils/resourceUtils.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LModalForm from "@/components/basic/ModalForm.vue";
import type {DataDictionaryEntity} from "@/types/apis/resource-server/dataDictionaryDomain.ts";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";

const { message } = App.useApp()
const DEFAULT_DICTIONARY_TYPE_DEFAULT = {
  code: "",
  name: "",
  id:null as unknown as number,
  version:null as unknown as number,
}

interface DictionaryTypeProps {
  columns: SearchableColumnType[]
  openKeys: number[]
  parent?: DictionaryTypeEntity
  dataSource: DictionaryTypeEntity[]
  formOpen: boolean
  selectedRows: DictionaryTypeEntity[]
  entity: DictionaryTypeSavePayload
  actionButtons:NonNullable<MenuProps['items']>
}

interface DataDictionary {
  query:PageRequest
  selectedRows: DataDictionaryEntity[]
  columns: SearchableColumnType[]
}

defineOptions({
  name: 'ResourceServerDictionaryHome'
})


const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const options = ref<{
  dictionaryType:DictionaryTypeProps
  dataDictionary:DataDictionary
}>({
  dictionaryType:{
    formOpen:false,
    openKeys:[],
    dataSource:[],
    entity: {...DEFAULT_DICTIONARY_TYPE_DEFAULT},
    selectedRows:[],
    columns:[
      {
        title: globalProperties.$t("common.name"),
        dataIndex:'name',
        key:'name',
        search:{
          component: markRaw(Input),
          props:{placeholder: globalProperties.$t('search.placeholder.input')},
          expression:'like'
        },
      }
    ],
    actionButtons:[]
  },
  dataDictionary:{
    selectedRows:[],
    columns:[
      {
        title: globalProperties.$t("common.name"),
        dataIndex:'name',
        key:'name',
        search:{
          component: markRaw(Input),
          props:{placeholder: globalProperties.$t('search.placeholder.input')},
          expression:'like'
        },
      },
      {
        title: globalProperties.$t("resourceServer.code"),
        dataIndex:'code',
        key:'code',
        search:{
          component: markRaw(Input),
          props:{placeholder: globalProperties.$t('search.placeholder.input')},
          expression:'like'
        },
      },
      {
        title: globalProperties.$t("resourceServer.dataDictionary.valueType"),
        dataIndex:'valueType',
        key:'valueType',
        search:{
          component: markRaw(Select),
          props:{classes:{root:'w-full'}, fieldNames:{label:'name'}, placeholder: globalProperties.$t('search.placeholder.select')},
          expression:'eq'
        },
      },
      {
        title: globalProperties.$t("resourceServer.dataDictionary.level"),
        dataIndex:'level',
        key:'level',
        search:{
          component: markRaw(Input),
          props:{placeholder: globalProperties.$t('search.placeholder.input')},
          expression:'like'
        },
      },
      {
        title: globalProperties.$t("common.enabled"),
        dataIndex:'enabled',
        key:'enabled',
        search:{
          component: markRaw(Select),
          props:{classes:{root:'w-full'}, fieldNames:{label:'name'}, placeholder: globalProperties.$t('search.placeholder.select')},
          expression:'eq'
        },
      },
    ],
    query:{
      number: 1,
      size: 10,
    }
  },
})

const dictionaryTypeService = new DictionaryTypeService();
const dataDictionaryService = new DataDictionaryService();
const resourceServerService = new ResourceServerService();

const selectedDictionaryType = ref<DictionaryTypeEntity | null>(null)

const dataDictionaryTable = ref()
const dictionaryTypeTable = ref()
const dictionaryTypeForm = ref()

const onDictionaryTypeRow: NonNullable<TableProps['onRow']> = (record) => {
  const row = record as DictionaryTypeEntity
  return {
    onClick: (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (
        el.closest(
          'button, a, input, textarea, select, label, .ant-checkbox, .ant-checkbox-wrapper, [role="button"]',
        )
      ) {
        return
      }
      selectedDictionaryType.value = row
      options.value.dataDictionary.query['filter_[type_id_eq]'] = row.id
      dataDictionaryTable.value.fetchDataSource()
    },
  }
}

function dictionaryTypeRowClassName(record: DictionaryTypeEntity) {
  const cur = selectedDictionaryType.value
  if (cur == null) {
    return ''
  }
  return String(cur.id) === String(record.id) ? 'text-link-active' : ''
}

function dictionaryTypeTableActionItemClick(key:string, record: DictionaryTypeEntity) {
  if (key === 'addChild') {
    options.value.dictionaryType.parent = record;
    options.value.dictionaryType.entity.parentId = record.id;
    options.value.dictionaryType.formOpen = true;
  } else if (key === 'edit') {
    options.value.dictionaryType.entity.id = record.id;
    options.value.dictionaryType.formOpen = true;
  }
}

function onSaveSuccessDictionaryType() {
  dictionaryTypeTable.value.fetchDataSource();
  dictionaryTypeForm.value.cancel();
  options.value.dictionaryType.entity = {...DEFAULT_DICTIONARY_TYPE_DEFAULT}
}

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ValueTypeEnum"}, {"id":"YesOrNo"}]})
  if (enums.data) {
    const enabledCol = options.value.dataDictionary.columns[options.value.dataDictionary.columns.findIndex(s => s.dataIndex === "enabled")]
    if (enabledCol?.search) {
      enabledCol.search.props = enabledCol.search.props ?? {}
      enabledCol.search.props.options = enums.data['resource-server']?.YesOrNo
    }

    const valueTypeCol = options.value.dataDictionary.columns[options.value.dataDictionary.columns.findIndex(s => s.dataIndex === "valueType")]
    if (valueTypeCol?.search) {
      valueTypeCol.search.props = valueTypeCol.search.props ?? {}
      valueTypeCol.search.props.options = enums.data['resource-server']?.ValueTypeEnum
    }
  }
  if (principalStore.hasPermission('perms[resource_server_data_dictionary:save]')) {
    options.value.dictionaryType.actionButtons.push(
      {
        key: 'addChild',
        label: globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('icon-editor-add-cell'),
      }
    )
  }

  if (globalProperties.$route.query.typeId) {
    await activated(globalProperties.$route.query.typeId as string)
  }
}

function formatDataDictionaryDragPreview(record: DataDictionaryEntity) {
  return record.name
}

async function onDrop(
  sorts: TreeSortMetadata<number>[]
) {
  const result: RestResult<void> = await dataDictionaryService.sort(sorts)
  message.success(result.message)
}

async function activated(typeId:string | number) {
  if (!typeId) {
    return ;
  }
  options.value.dataDictionary.query["filter_[type_id_eq]"] = globalProperties.$route.query.typeId
  await dataDictionaryTable.value.fetchDataSource();
  const data = findFirstTreeNode(r => String(r.id) === typeId, options.value.dictionaryType.dataSource);
  if (!data) {
    return ;
  }
  selectedDictionaryType.value = data
  dictionaryTypeRowClassName(data);
  if (!data.parentId) {
    return ;
  }

  const parents = findAllTreeNodes(r => r.id === data.parentId, options.value.dictionaryType.dataSource)
  if (parents.length <= 0) {
    return ;
  }
  options.value.dictionaryType.openKeys = unmergeTree(parents).map(r => r.id);
}

onActivated(() => activated(globalProperties.$route.query.typeId as string))

onMounted(mounted)
</script>

<template>
  <div>
    <l-menu-title-card :classes="{body:'pt-1 pr-0 pl-0 pb-0'}">

      <a-splitter >
        <a-splitter-panel default-size="20%" min="15%" max="25%">
          <l-crud-table
            ref="dictionaryTypeTable"
            :expandable="{expandedRowKeys:options.dictionaryType.openKeys, onExpandedRowsChange:(expandedRows:number[]) => options.dictionaryType.openKeys = expandedRows}"
            :bordered="false"
            :pagination="false"
            v-model:data-source="options.dictionaryType.dataSource"
            :service="dictionaryTypeService"
            :columns="options.dictionaryType.columns"
            :action-buttons="options.dictionaryType.actionButtons"
            :authority="{
              edit:'perms[resource_server_dictionary_type:save]',
              add:'perms[resource_server_dictionary_type:save]',
              delete:'perms[resource_server_dictionary_type:delete]'
            }"
            :scroll="{x:'max-content'}"
            :row-selection="{type: 'checkbox', onChange:(_keys:number[],rows:DictionaryTypeEntity[]) => options.dictionaryType.selectedRows = rows}"
            :row-class-name="dictionaryTypeRowClassName"
            @action-button-click="(key:string, record:DictionaryTypeEntity) => dictionaryTypeTableActionItemClick(key,record)"
            @edit="r => dictionaryTypeTableActionItemClick('edit', r)"
            :on-row="onDictionaryTypeRow"
            >
            <template #title>
              <a-flex justify="space-between" align="center">
                <a-space>
                  <icon-font icon="icon align" type="icon-category" />
                  <span>{{globalProperties.$t('resourceServer.dictionaryType.routePage')}}</span>
                </a-space>
                <l-authority-button
                  class="mr-md"
                  size="small"
                  :authority="{
                    add:'perms[resource_server_dictionary_type:save]',
                    delete:'perms[resource_server_dictionary_type:delete]',
                  }"
                  @delete="dictionaryTypeTable.remove(options.dictionaryType.selectedRows)"
                  @add="options.dictionaryType.formOpen = true"
                />
              </a-flex>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'name'">
                <a-tooltip :title="record.code">
                  <span>{{record.name}}</span>
                </a-tooltip>
              </template>
            </template>
          </l-crud-table>
        </a-splitter-panel>
        <a-splitter-panel >
          <l-crud-table
            ref="dataDictionaryTable"
            drag
            :enabled-title-actions="selectedDictionaryType !== null"
            :format-drag-preview="formatDataDictionaryDragPreview"
            @drop="onDrop"
            :expand-icon-column-index="3"
            :bordered="false"
            :immediate="false"
            :query="options.dataDictionary.query"
            :service="dataDictionaryService"
            :columns="options.dataDictionary.columns"
            :authority="{
              add:'perms[resource_server_data_dictionary:save]',
              edit:'perms[resource_server_data_dictionary:save]',
              delete:'perms[resource_server_data_dictionary:delete]',
              detail:'perms[resource_server_data_dictionary:get]'
            }"
            :scroll="{x:'max-content'}"
            :row-selection="{type: 'checkbox', onChange:(_keys:number[],rows:DataDictionaryEntity[]) => options.dataDictionary.selectedRows = rows}"
            @add="globalProperties.$router.push({name:'resource_server_data_dictionary_add',query:{typeId: selectedDictionaryType?.id }})"
            @detail="r => globalProperties.$router.push({name:'resource_server_data_dictionary_detail', query:{id:String(r.id)}})"
            @edit="r => globalProperties.$router.push({name:'resource_server_data_dictionary_edit', query:{id:String(r.id)}})"
          >
            <template #title>
              <a-flex justify="space-between" align="center">
                <a-space>
                  <icon-font icon="icon align" type="icon-product-list" />
                  <span>{{globalProperties.$t('resourceServer.dataDictionary.routePage')}}</span>
                </a-space>
                <l-authority-button
                  class="mr-md"
                  v-if="selectedDictionaryType !== null"
                  size="small"
                  :authority="{
                    add:'perms[resource_server_data_dictionary:save]',
                    delete:'perms[resource_server_data_dictionary:delete]'
                  }"
                  @delete="dataDictionaryTable.remove(options.dataDictionary.selectedRows)"
                  @add="globalProperties.$router.push({name:'resource_server_data_dictionary_add',query:{typeId: selectedDictionaryType.id}})"
                />
              </a-flex>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'valueType'">
                {{ getEnumName(record.valueType) }}
              </template>
              <template v-if="column.dataIndex === 'enabled'">
                {{ getEnumName(record.enabled) }}
              </template>
            </template>
          </l-crud-table>
        </a-splitter-panel>
      </a-splitter>
    </l-menu-title-card>

    <l-modal-form
      ref="dictionaryTypeForm"
      @cancel="options.dictionaryType.entity = {...DEFAULT_DICTIONARY_TYPE_DEFAULT}"
      @success="onSaveSuccessDictionaryType"
      :title="globalProperties.$t('common.add', {name: ' ' + globalProperties.$t('resourceServer.dictionaryType.routePage')})"
      v-model:open="options.dictionaryType.formOpen"
      operation-data-trace-target="tb_dictionary_type"
      :service="dictionaryTypeService"
      v-model:entity="options.dictionaryType.entity"
    >
      <a-form-item name="name" :label="globalProperties.$t('common.name')" :rules="[{required: true}]">
        <a-input v-model:value="options.dictionaryType.entity.name" />
      </a-form-item>
      <a-form-item name="code" :label="globalProperties.$t('resourceServer.code')" :rules="[{required: true}]">
        <a-input v-model:value="options.dictionaryType.entity.code">
          <template #prefix v-if="options.dictionaryType.parent">
            {{options.dictionaryType.parent.code + '.'}}
          </template>
        </a-input>
      </a-form-item>
    </l-modal-form>
  </div>

</template>
