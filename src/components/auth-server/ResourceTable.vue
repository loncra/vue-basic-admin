<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue'
import {App, Input, Select, type TableProps} from 'antdv-next';
import {ResourceServerService, ResourceService} from "@/apis";
import type {
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  ResourceEntity,
  RestResult,
  TreeSortMetadata
} from "@/types/apis";
import {applyColumnOptions, createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import type {FilterRequest} from '@/types/apis/common';
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import {
  AUTH_SERVER_RESOURCE_AUTHORITY,
  AUTH_SERVER_RESOURCE_ROUTE,
  SYSTEM_MODULE_NAME
} from "@/constants";

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
  rowSelection:() => ({fixed: true, type: 'checkbox'})
})
const { message } = App.useApp()

const service = new ResourceService()

const columns = computed<SearchableColumnType[]>(() => [
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

const rowActions = ref<ActionDefinition<ResourceEntity>[]>([])

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
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[{"id":"ResourceSourceEnum"}],
    [SYSTEM_MODULE_NAME.AUTH_SERVER]:[{"id":"ResourceTypeEnum"},{"id":'ResourceCategoryEnum'}]})
  if (enums.data) {
    applyColumnOptions(columns.value, "type", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.ResourceTypeEnum || [])
    applyColumnOptions(columns.value, "category", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.ResourceCategoryEnum || [])
    applyColumnOptions(columns.value, "sources", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.ResourceSourceEnum || [])
  }
  if (principalStore.hasPermission(AUTH_SERVER_RESOURCE_AUTHORITY.SAVE)) {
    rowActions.value.push(
      {
        id: 'addChild',
        permission: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
        label: () => globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('loncra-list-tree'),
        run: (ctx) => {
          if (ctx.record) {
            globalProperties.$router.push({name:AUTH_SERVER_RESOURCE_ROUTE.ADD_CHILD, query:{parentId:String(ctx.record.id)}})
          }
        },
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
    :row-actions="rowActions"
    :record-actions="!props.preview"
    :authority="{
      add:AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      edit:AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      detail:AUTH_SERVER_RESOURCE_AUTHORITY.GET,
      delete:AUTH_SERVER_RESOURCE_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content', y: 350}"
    :row-selection="props.rowSelection"
    @add="globalProperties.$router.push({name:AUTH_SERVER_RESOURCE_ROUTE.ADD})"
    @detail="r => globalProperties.$router.push({name:AUTH_SERVER_RESOURCE_ROUTE.DETAIL, query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:AUTH_SERVER_RESOURCE_ROUTE.EDIT, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'name'">
        <a-space>
          <icon-font class="icon align" :type="record.icon || 'loncra-file'" />
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
