<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import type {MenuItemType, TableProps} from 'antdv-next';
import {Input, Select} from 'antdv-next'
import {ResourceServerService, ResourceService} from "@/apis";
import type {NameValueEnumMetadata, ResourceEntity, RestResult} from "@/types";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import {createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import type {FilterRequest} from '@/types/common';
import type {MenuInfo} from '@v-c/menu';

defineOptions({
  name: 'LResourceTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  preview?: boolean,
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"],
}>(), {
  preview: false,
  filter: () => ({}),
  rowSelection:() => ({type: 'checkbox'})
})

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
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
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
const authorityOperateTable = ref();

const actionItems = ref<MenuItemType[]>([
  {
    key: 'addChild',
    label: globalProperties.$t('common.addChild'),
    icon: () => createIcon('icon-editor-add-cell'),
  },
])

function removeSelected(selectedRows: ResourceEntity[]) {
  authorityOperateTable.value.remove(selectedRows);
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

}

function getSourcesName(sources: NameValueEnumMetadata<number>[]): string {
  return sources.map(s => getEnumName(s)).join(",")
}

function clearDataSource() {
  dataSource.value = []
}

function fetchDataSource() {
  authorityOperateTable.value.fetchDataSource()
}

function onActionItemClick(e: MenuInfo, record: ResourceEntity) {
  if (e.key === 'addChild') {
    globalProperties.$router.push({name:'auth_server_resource_addChild', query:{parentId:String(record.id)}})
  }
}

defineExpose({
  removeSelected,
  clearDataSource,
  fetchDataSource
})

onMounted(mounted)
</script>

<template>
  <div>
    <l-authority-operate-table
      v-bind="$attrs"
      ref="authorityOperateTable"
      :query="query"
      v-model:data-source="dataSource"
      :service="service"
      :columns="columns"
      :action-items="actionItems"
      :enabled-actions="!props.preview"
      :authority="{edit:'perms[auth_server_authority_resource:save]',detail:'perms[auth_server_authority_resource:get]', delete:'perms[auth_server_authority_resource:delete]'}"
      :scroll="{x:'max-content', y: 350}"
      :row-selection="rowSelection"
      @actionItemClick="onActionItemClick"
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
    </l-authority-operate-table>
  </div>
</template>
