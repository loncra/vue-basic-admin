<script setup lang="ts">
import LCrudTable from '@/components/basic/crud/CrudTable.vue'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref
} from 'vue'
import {Input, Select} from 'antdv-next'
import type {
  EnumBucketsResponseBody,
  FilterRequest,
  McpPackageEntity,
  NameValueEnumMetadata,
  RestResult,
} from '@/types/apis'
import {AiMcpPackageService} from '@/apis/ai-server/aiMcpPackageService.ts'
import {ResourceServerService} from '@/apis'
import {getEnumName, requireNonNullOrUndefined} from '@/utils'
import {MCP_PACKAGE_AUTHORITY, MCP_PACKAGE_ROUTE, SYSTEM_MODULE_NAME,} from '@/constants'
import type {SearchableColumnType} from '@/types/composables'

defineOptions({
  name: 'AiServerMcpPackageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiMcpPackageService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: "name",
    key: "name",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.authMode'),
    dataIndex: "authMode",
    key: "auth_mode",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.packageKey'),
    dataIndex: "packageKey",
    key: "package_key",
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.origin'),
    dataIndex: "origin",
    key: "origin",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('common.status'),
    dataIndex: "status",
    key: "status",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('common.type'),
    dataIndex: "type",
    key: "type",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.dynamicActivation'),
    dataIndex: "dynamicActivation",
    key: "dynamic_activation",
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      expression: 'eq',
    },
  },
])

const options = ref<{
  selectedRows: McpPackageEntity[]
  query: FilterRequest
}>({
  selectedRows: [],
  query: {}
})

function applyColumnOptions(dataIndex: string, enumOptions: NameValueEnumMetadata<number | string>[]) {
  const column = columns.value.find((item) => item.dataIndex === dataIndex)
  if (column?.search) {
    column.search.props = column.search.props ?? {}
    column.search.props.options = enumOptions
  }
}
async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: "YesOrNo"},
        {id: "DataStatusEnum"},
      ],
      [SYSTEM_MODULE_NAME.AI_SERVER]: [
        {id: "McpPackageAuthModeEnum"},
        {id: "PackageOriginEnum"},
        {id: "PackageTypeEnum"},
      ],
    })
  if (!enums.data) {
    return
  }
  const resourceServer = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}
  const aiServer = enums.data[SYSTEM_MODULE_NAME.AI_SERVER] ?? {}
  applyColumnOptions("authMode", aiServer["McpPackageAuthModeEnum"] || [])
  applyColumnOptions("origin", aiServer["PackageOriginEnum"] || [])
  applyColumnOptions("type", aiServer["PackageTypeEnum"] || [])

  applyColumnOptions("status", resourceServer["DataStatusEnum"] || [])
  applyColumnOptions("dynamicActivation",resourceServer["YesOrNo"] || [])
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      v-model:query="options.query"
      v-model:selected-rows="options.selectedRows"
      :service="service"
      :columns="columns"
      :authority="{
        add: MCP_PACKAGE_AUTHORITY.SAVE,
        edit: MCP_PACKAGE_AUTHORITY.SAVE,
        delete: MCP_PACKAGE_AUTHORITY.DELETE,
        detail: MCP_PACKAGE_AUTHORITY.GET,
      }"
      :scroll="{x: 'max-content'}"
      :row-selection="{fixed: true, type: 'checkbox'}"
      @add="globalProperties.$router.push({name: MCP_PACKAGE_ROUTE.ADD})"
      @detail="
        (record) =>
          globalProperties.$router.push({
            name: MCP_PACKAGE_ROUTE.DETAIL,
            query: {id: String(record.id)},
          })
      "
      @edit="
        (record) =>
          globalProperties.$router.push({
            name: MCP_PACKAGE_ROUTE.EDIT,
            query: {id: String(record.id)},
          })
      "
    >
      <template #bodyCell="{column, record}">
        <template v-if="column.dataIndex === 'authMode'">
          {{ getEnumName(record.authMode) }}
        </template>
        <template v-if="column.dataIndex === 'origin'">
          {{ getEnumName(record.origin) }}
        </template>
        <template v-if="column.dataIndex === 'status'">
          {{ getEnumName(record.status) }}
        </template>
        <template v-if="column.dataIndex === 'type'">
          {{ getEnumName(record.type) }}
        </template>
        <template v-if="column.dataIndex === 'dynamicActivation'">
          {{ getEnumName(record.dynamicActivation) }}
        </template>
      </template>
    </l-crud-table>
  </div>
</template>
