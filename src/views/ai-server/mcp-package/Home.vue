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
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  FilterRequest,
  McpPackageEntity,
  McpPackageSavePayload,
  RestResult,
} from '@/types/apis'
import {AiMcpPackageService} from '@/apis/ai-server/aiMcpPackageService.ts'
import {ResourceServerService} from '@/apis'
import {
  applyColumnOptions,
  createIcon,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from '@/utils'
import {
  DATA_STATUS,
  ICON_SELECT_AVATAR_MODE_VALUE,
  MCP_GROUP_CODE_PREFIX,
  MCP_PACKAGE_AUTHORITY,
  MCP_PACKAGE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables'
import useApp from "antdv-next/dist/app/useApp";
import LIconSelect from "@/components/basic/IconSelect.vue";

defineOptions({
  name: 'AiServerMcpPackageHome',
})

const { modal, message } = useApp();

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiMcpPackageService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: "name",
    key: "name",
    width:320,
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
    width:120,
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
    width:160,
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.origin'),
    dataIndex: "origin",
    key: "origin",
    width:80,
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
    width:80,
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
    width:80,
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
    title: globalProperties.$t('common.group'),
    dataIndex: "category",
    key: MCP_GROUP_CODE_PREFIX,
    width:150,
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      queryName:'filter_[category.code_jeq]'
    },
  },
  {
    title: globalProperties.$t('aiServer.mcpPackage.dynamicActivation'),
    dataIndex: "dynamicActivation",
    key: "dynamic_activation",
    width:120,
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

const table = ref()

const bulkActions = function(): ActionDefinition<McpPackageSavePayload>[] {
  return [
    {
      id: 'releaseSelect',
      permission: MCP_PACKAGE_AUTHORITY.RELEASE,
      enabled: (ctx) => getReleaseSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.release.selected', {
          count: getReleaseSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('loncra-screen-share'),
      run: (ctx) => release(getReleaseSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
    {
      id: 'revokeSelect',
      permission: MCP_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => getRevokeSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.revoke.selected', {
          count: getRevokeSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('loncra-screen-share-off'),
      run: (ctx) => revoke(getRevokeSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
  ]
}

const itemActionDefinitions = function(): ActionDefinition<McpPackageSavePayload>[] {
  return [
    {
      id: 'release',
      permission: MCP_PACKAGE_AUTHORITY.RELEASE,
      enabled: (ctx) => getEnumValue(ctx.record!.status) !== DATA_STATUS.RELEASE,
      label: () => globalProperties.$t('common.release.text'),
      icon: () => createIcon('loncra-screen-share'),
      run: (ctx) => release([Number(ctx.record!.id)]),
    },
    {
      id: 'revoke',
      permission: MCP_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => getEnumValue(ctx.record!.status) === DATA_STATUS.RELEASE,
      label: () => globalProperties.$t('common.revoke.text'),
      icon: () => createIcon('loncra-screen-share-off'),
      run: (ctx) => revoke([Number(ctx.record!.id)]),
    }
  ]
}

function getReleaseSelectedEntities(selectedRows: McpPackageSavePayload[]) {
  return selectedRows.filter((e) => {
    const status = getEnumValue(e.status ?? 0)
    return status === DATA_STATUS.NEW || status === DATA_STATUS.REVOKE
  })
}

function getRevokeSelectedEntities(selectedRows: McpPackageSavePayload[]) {
  return selectedRows.filter(e => getEnumValue(e.status ?? 0) === DATA_STATUS.RELEASE)
}

function release(ids: number[]) {
  if (ids.length === 0) {
    return
  }
  const content = ids.length === 1
    ? globalProperties.$t('common.release.confirmSingle')
    : globalProperties.$t('common.release.confirmBatch', {count: ids.length})
  modal.confirm({
    title: globalProperties.$t('common.release.confirmTitle'),
    content,
    onOk: () => doRelease(ids),
  })
}

async function doRelease(ids: number[]) {
  try {
    const result: RestResult<void> = await service.release(ids)
    message.success(result.message)
    table.value.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function revoke(ids: number[]) {
  if (ids.length === 0) {
    return
  }
  const content = ids.length === 1
    ? globalProperties.$t('common.revoke.confirmSingle')
    : globalProperties.$t('common.revoke.confirmBatch', {count: ids.length})
  modal.confirm({
    title: globalProperties.$t('common.revoke.confirmTitle'),
    content,
    onOk: () => doRevoke(ids),
  })
}

async function doRevoke(ids: number[]) {
  try {
    const result: RestResult<void> = await service.revoke(ids)
    message.success(result.message)
    table.value.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.YES_OR_NO},
        {id: SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM},
      ],
      [SYSTEM_MODULE_NAME.AI_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_AUTH_MODE_ENUM},
        {id: SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM},
        {id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM},
      ],
    })
  if (!enums.data) {
    return
  }

  applyColumnOptions(columns.value, "authMode", enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.MCP_PACKAGE_AUTH_MODE_ENUM] || [])
  applyColumnOptions(columns.value, "origin", enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM] || [])
  applyColumnOptions(columns.value, "type", enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM] || [])

  applyColumnOptions(columns.value, "status", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM] || [])
  applyColumnOptions(columns.value, "dynamicActivation", enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] || [])

  const dataDictionaryResult:RestResult<Record<string, DataDictionaryMetadata[]>> = await ResourceServerService.findDataDictionariesByCodes([MCP_GROUP_CODE_PREFIX])
  if (!dataDictionaryResult.data) {
    return
  }

  for (const key in dataDictionaryResult.data) {
    applyColumnOptions(columns.value,key,(dataDictionaryResult.data[key] || []).map(item => ({name: item.name, value: item.code})))
  }
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-crud-table
      ref="table"
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
      :actions="bulkActions()"
      :row-actions="itemActionDefinitions()"
    >
      <template #bodyCell="{column, record}">
        <template v-if="column.dataIndex === 'name'">
          <a-space>
            <l-icon-select preview :value="record.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name"  />
            {{ record.name }}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'category'">
          {{ record.category?.name }}
        </template>
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
