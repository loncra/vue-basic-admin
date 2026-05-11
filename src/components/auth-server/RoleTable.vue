<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref} from 'vue'
import {Input, Select} from 'antdv-next'
import {ResourceServerService} from "@/apis";
import type {RestResult} from "@/types";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import {getEnumName, requireNonNullOrUndefined} from "@/utils";
import type {NameValueEnumMetadata} from "@/types/common.ts";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import type {RoleEntity} from "@/types/auth-server/roleType.ts";
import type { FilterRequest } from '@/types/common';
import type { TableProps } from 'antdv-next';

defineOptions({
  name: 'LRoleTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  preview?: boolean
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"]
}>(), {
  preview: false,
  filter: () => ({}),
  rowSelection: () => ({type: 'checkbox'})
})

const service = new RoleService()
const resourceServerService = new ResourceServerService()

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
const authorityOperateTable = ref();
const yesOrNoFields = ["modifiable", "enabled", "removable"];

const selectedRecords = defineModel<RoleEntity[]>('selectedRows', {default: () => []})

function removeSelected() {
  authorityOperateTable.value.remove(selectedRecords.value);
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

}

function getSourcesName(sources: NameValueEnumMetadata<number>[]): string {
  return sources.map(s => getEnumName(s)).join(",")
}

defineExpose({
  removeSelected
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
      v-model:selected-rows="selectedRecords"
      :service="service"
      :columns="columns"
      :enabled-actions="!props.preview"
      :authority="{edit:'perms[auth_server_role:save]',detail:'perms[auth_server_role:get]', delete:'perms[auth_server_role:delete]'}"
      :scroll="{x:'max-content'}"
      :row-selection="rowSelection"
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
    </l-authority-operate-table>
  </div>
</template>
