<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import {App, Input, type MenuItemType, Select, type TableProps} from 'antdv-next';
import {ResourceServerService, ResourceService} from "@/apis";
import type {
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  ResourceEntity,
  RestResult,
  TreeSortMetadata
} from "@/types/apis";
import {createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import type {FilterRequest} from '@/types/apis/common';
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";

defineOptions({
  name: 'LResourceTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const props = withDefaults(defineProps<{
  preview?: boolean,
  drag?:boolean,
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"],
}>(), {
  preview: false,
  drag:true,
  rowSelection:() => ({type: 'checkbox'})
})
const { message } = App.useApp()

const service = new ResourceService()
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
    width: 450,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('authServer.authority'),
    dataIndex: 'authority',
    key: 'authority',
    ellipsis:true,
    width: 250,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('authServer.resource.applicationName'),
    dataIndex: 'applicationName',
    key: 'application_name',
    width: 150,
    ellipsis:true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.source'),
    dataIndex: 'sources',
    width: 300,
    ellipsis:true,
    key: 'sources',
    search:{
      component: markRaw(Select),
      props:{mode:"multiple", placeholder: globalProperties.$t('search.placeholder.select'),fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression:'jin'
    },
  },
  {
    title: globalProperties.$t('authServer.resource.page'),
    dataIndex: 'page',
    width: 350,
    ellipsis:true,
    key: 'page',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('common.type'),
    dataIndex: 'type',
    key: 'type',
    ellipsis:true,
    width: 150,
    search:{
      component: markRaw(Select),
      props: {mode:'multiple',placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'in',
    },
  },
  {
    title: globalProperties.$t('common.category'),
    dataIndex: 'category',
    key: 'category',
    ellipsis:true,
    width: 150,
    search:{
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
])

const dataSource = ref<ResourceEntity[]>([])
const crudTable = ref()

const actionButtons = ref<MenuItemType[]>([])

function removeSelected(selectedRows: ResourceEntity[]) {
  crudTable.value.remove(selectedRows);
}

async function mounted() {
  if (!props.preview) {
    columns.value.splice(2, 0, {
      title: globalProperties.$t('authServer.source'),
      dataIndex: 'sources',
      width: 300,
      ellipsis:true,
      key: 'sources',
      search:{
        component: markRaw(Select),
        props:{mode:"multiple", placeholder: globalProperties.$t('search.placeholder.select'),fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
        expression:'jin'
      },
    });
  }
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ResourceSourceEnum"}],"auth-server":[{"id":"ResourceTypeEnum"},{"id":'ResourceCategoryEnum'}]})
  if (enums.data) {
    const typeCol = columns.value[columns.value.findIndex(s => s.dataIndex === "type")];
    if (typeCol?.search) {
      typeCol.search.props = typeCol.search.props ?? {}
      typeCol.search.props.options = enums.data['auth-server']?.ResourceTypeEnum
    }

    const categoryCol = columns.value[columns.value.findIndex(s => s.dataIndex === "category")];
    if (categoryCol?.search) {
      categoryCol.search.props = categoryCol.search.props ?? {}
      categoryCol.search.props.options = enums.data['auth-server']?.ResourceCategoryEnum
    }

    const statusCol = columns.value.find((s) => s.dataIndex === 'sources')
    if (statusCol?.search) {
      statusCol.search.props = statusCol.search.props ?? {}
      statusCol.search.props.options = enums.data['resource-server']?.ResourceSourceEnum
    }
  }
  if (principalStore.hasPermission('perms[resource_server_data_dictionary:save]')) {
    actionButtons.value.push(
      {
        key: 'addChild',
        label: globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('icon-editor-add-cell'),
      }
    )
  }
}

function getSourcesName(sources: NameValueEnumMetadata<number>[]): string {
  return sources.map(s => getEnumName(s)).join(",")
}

function clearDataSource() {
  dataSource.value = []
}

function fetchDataSource() {
  crudTable.value.fetchDataSource()
}

function onActionButtonClick(key: string, record: ResourceEntity) {
  if (key === 'addChild') {
    globalProperties.$router.push({name:'auth_server_resource_addChild', query:{parentId:String(record.id)}})
  }
}

function formatDragPreview(record: ResourceEntity) {
  return record.name
}

async function onTreeDrop(
  sorts: TreeSortMetadata<number>[]
) {
  const result: RestResult<void> = await service.sort(sorts)
  message.success(result.message)
}

defineExpose({
  removeSelected,
  clearDataSource,
  fetchDataSource
})

onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :drag="props.drag"
    :format-drag-preview="formatDragPreview"
    @tree-drop="onTreeDrop"
    :expand-icon-column-index="props.drag ? 3 : 2"
    :pagination="false"
    ref="crudTable"
    :query="query"
    v-model:data-source="dataSource"
    :service="service"
    :columns="columns"
    :action-buttons="actionButtons"
    :enabled-actions="!props.preview"
    :authority="{
      add:'perms[auth_server_authority_resource:save]',
      edit:'perms[auth_server_authority_resource:save]',
      detail:'perms[auth_server_authority_resource:get]',
      delete:'perms[auth_server_authority_resource:delete]'
    }"
    :scroll="{x:'max-content', y: 350}"
    :row-selection="rowSelection"
    @actionButtonClick="onActionButtonClick"
    @add="globalProperties.$router.push({name:'auth_server_resource_add'})"
    @detail="r => globalProperties.$router.push({name:'auth_server_resource_detail', query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:'auth_server_resource_edit', query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'name'">
        <a-space>
          <icon-font class="icon align" :type="record.icon || 'icon-survey'" />
          {{ record.name}}
        </a-space>
      </template>
      <template v-if="column.dataIndex === 'sources'">
        {{ getSourcesName(record.sources) }}
      </template>

      <template v-if="column.dataIndex === 'type'">
        {{ record.type.name }}
      </template>

      <template v-if="column.dataIndex === 'category'">
        {{ record.category.name }}
      </template>
    </template>
  </l-crud-table>
</template>
