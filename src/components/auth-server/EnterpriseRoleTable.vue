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
import {EnterpriseRoleService, ResourceServerService} from "@/apis";
import type {
  EnterpriseRoleEntity,
  EnumBucketsResponseBody,
  FilterRequest,
  RestResult
} from "@/types/apis";
import {applyColumnOptions, createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LCrudTable from "@/components/basic/crud/CrudTable.vue";
import type {ActionDefinition, SearchableColumnType} from "@/types/composables";
import {mergeDefinitions} from "@/composables/basic/action";
import {
  AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_ROLE_ROUTE,
  SYSTEM_MODULE_NAME
} from "@/constants";

defineOptions({
  name: 'LEnterpriseRoleTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const props = withDefaults(defineProps<{
  preview?: boolean
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"]
  rowActions?: ActionDefinition<EnterpriseRoleEntity>[]
}>(), {
  preview: false,
  rowSelection: () => ({fixed: true, type: 'checkbox'})
})

const service = new EnterpriseRoleService()

const actionButtons = ref<ActionDefinition<EnterpriseRoleEntity>[]>([])

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
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

const dataSource = ref<EnterpriseRoleEntity[]>([])
const yesOrNoFields = ["modifiable", "enabled", "removable"];

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[
      {"id":"YesOrNo"},
    ]
  })
  if (enums.data) {
    for (const dataIndex of yesOrNoFields){
      applyColumnOptions(columns.value, dataIndex, enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.YesOrNo || [])
    }
  }
  if (principalStore.hasPermission(AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE)) {
    actionButtons.value.push(
      {
        id: 'addChild',
        permission: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
        label: () => globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('loncra-list-tree'),
        run: (ctx) => {
          if (ctx.record) {
            globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD_CHILD, query:{parentId:String(ctx.record.id)}})
          }
        },
      }
    )
  }
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
      add:AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
      edit:AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
      detail:AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.GET,
      delete:AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.DELETE
    }"
    :scroll="{x:'max-content'}"
    :row-selection="props.rowSelection"
    @add="globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD})"
    @detail="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.DETAIL, query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.EDIT, query:{id:String(r.id)}})"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="yesOrNoFields.includes(column.dataIndex)">
        {{ getEnumName(record[column.dataIndex as keyof EnterpriseRoleEntity])}}
      </template>
    </template>
  </l-crud-table>
</template>
