<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import type {MenuItemType, TableProps} from 'antdv-next';
import {Input, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {
  EnumBucketsResponseBody,
  FilterRequest,
  NameValueEnumMetadata,
  RestResult,
  RoleEntity
} from "@/types/apis";
import {createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LCrudTable from "@/components/basic/CrudTable.vue";
import type {SearchableColumnType} from "@/types/composables";

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
}>(), {
  preview: false,
  rowSelection: () => ({type: 'checkbox'})
})

const service = new RoleService()
const resourceServerService = new ResourceServerService()

const actionButtons = ref<MenuItemType[]>([])

const columns = ref<SearchableColumnType[]>([
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
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"YesOrNo"}, {"id":"ResourceSourceEnum"}]})
  if (enums.data) {
    for (const dataIndex of yesOrNoFields){
      const genderCol = columns.value[columns.value.findIndex(s => s.dataIndex === dataIndex)];
      if (genderCol?.search) {
        genderCol.search.props = genderCol.search.props ?? {}
        genderCol.search.props.options = enums.data['resource-server']?.YesOrNo
      }
    }

    const statusCol = columns.value.find((s) => s.dataIndex === 'sources')
    if (statusCol?.search) {
      statusCol.search.props = statusCol.search.props ?? {}
      statusCol.search.props.options = enums.data['resource-server']?.ResourceSourceEnum
    }
  }
  if (principalStore.hasPermission('perms[auth_server_role:save]')) {
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

function onActionButtonClick(key: string, record: RoleEntity) {
  if (key === 'addChild') {
    globalProperties.$router.push({name:'auth_server_role_add_child', query:{parentId:String(record.id)}})
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
    :action-buttons="actionButtons"
    :enabled-actions="!props.preview"
    :authority="{
      add:'perms[auth_server_role:save]',
      edit:'perms[auth_server_role:save]',
      detail:'perms[auth_server_role:get]',
      delete:'perms[auth_server_role:delete]'
    }"
    :scroll="{x:'max-content'}"
    :row-selection="rowSelection"
    @action-button-click="onActionButtonClick"
    @add="globalProperties.$router.push({name:'auth_server_role_add'})"
    @detail="r => globalProperties.$router.push({name:'auth_server_role_detail', query:{id:String(r.id)}})"
    @edit="r => globalProperties.$router.push({name:'auth_server_role_edit', query:{id:String(r.id)}})"
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
