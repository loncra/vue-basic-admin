<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue'
import type {TableProps} from 'antdv-next';
import {Input, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {
  EnumBucketsResponseBody,
  FilterRequest,
  FindCurdService,
  NameValueEnumMetadata,
  RestResult,
  RoleEntity,
  RoleSavePayload
} from "@/types/apis";
import {applyColumnOptions, createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import {mergeDefinitions} from "@/composables/basic/action";
import {
  AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_ROLE_ROUTE,
  AUTH_SERVER_ROLE_AUTHORITY,
  AUTH_SERVER_ROLE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from "@/constants";

defineOptions({
  name: 'LRoleTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const props = withDefaults(defineProps<{
  preview?: boolean
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"]
  rowActions?: ActionDefinition<RoleEntity>[]
  service?: FindCurdService<RoleSavePayload, RoleEntity>
  authority?: typeof AUTH_SERVER_ROLE_AUTHORITY | typeof AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY
  route?: typeof AUTH_SERVER_ROLE_ROUTE | typeof AUTH_SERVER_ENTERPRISE_ROLE_ROUTE
}>(), {
  preview: false,
  rowSelection: () => ({fixed: true, type: 'checkbox'})
})

const service = props.service ?? new RoleService()
const tableAuthority = computed(() => props.authority ?? AUTH_SERVER_ROLE_AUTHORITY)
const tableRoute = computed(() => props.route ?? AUTH_SERVER_ROLE_ROUTE)

const actionButtons = ref<ActionDefinition<RoleEntity>[]>([])

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
    width: 150,
    ellipsis:true,
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
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('authServer.role.removable'),
    dataIndex: 'removable',
    key: 'removable',
    width: 150,
    ellipsis:true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.role.modifiable'),
    dataIndex: 'modifiable',
    key: 'modifiable',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('common.enabled'),
    dataIndex: 'enabled',
    key: 'enabled',
    width: 150,
    ellipsis:true,
    search:{
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
])

const dataSource = ref<RoleEntity[]>([])
const yesOrNoFields = ["modifiable", "enabled", "removable"];

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
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[
      {id: SYSTEM_ENUM_TYPE.YES_OR_NO},
      {id: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM}
    ]
  })
  if (enums.data) {
    for (const dataIndex of yesOrNoFields){
      applyColumnOptions(columns.value, dataIndex, enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] || [])
    }
    applyColumnOptions(columns.value, "sources", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM] || [])
  }
  if (principalStore.hasPermission(tableAuthority.value.SAVE)) {
    actionButtons.value.push(
      {
        id: 'addChild',
        permission: tableAuthority.value.SAVE,
        label: () => globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('loncra-list-tree'),
        run: (ctx) => {
          if (ctx.record) {
            globalProperties.$router.push({name:tableRoute.value.ADD_CHILD, query:{parentId:String(ctx.record.id)}})
          }
        },
      }
    )
  }
}

function getSourcesName(sources: NameValueEnumMetadata<number>[]): string {
  return sources.map(s => getEnumName(s)).join(",")
}

onMounted(mounted)
</script>

<template>
  <l-crud-table
    v-bind="$attrs"
    :query="query"
    v-model:data-source="dataSource"
    :service="service"
    :columns="columns"
    :row-actions="mergeDefinitions(actionButtons, props.rowActions ?? [])"
    :record-actions="!props.preview"
    :authority="{
      add:tableAuthority.SAVE,
      edit:tableAuthority.SAVE,
      detail:tableAuthority.GET,
      delete:tableAuthority.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.rowSelection"
    @add="globalProperties.$router.push({name:tableRoute.ADD})"
    @detail="r => globalProperties.$router.push({name:tableRoute.DETAIL, query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:tableRoute.EDIT, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'sources'">
        {{ getSourcesName(record.sources) }}
      </template>
      <template v-if="yesOrNoFields.includes(column.dataIndex)">
        {{ record[column.dataIndex]?.name }}
      </template>
    </template>
  </l-crud-table>
</template>
