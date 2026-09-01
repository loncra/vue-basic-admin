<script setup lang="ts">
import LCrudTable from '@/components/basic/crud/CrudTable.vue'
import LForm from '@/components/Form.vue'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onMounted,
  ref,
} from 'vue'
import {Input, Select} from 'antdv-next'
import type {
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  FilterRequest,
  RestResult,
  SkillPackageEntity,
  SkillPackageSavePayload,
} from '@/types/apis'
import {AiSkillPackageService} from '@/apis/ai-server/aiSkillPackageService.ts'
import {ResourceServerService} from '@/apis'
import {
  applyColumnOptions,
  createIcon,
  getEnumName,
  getEnumValue,
  getExecuteBadgeStatus,
  requireNonNullOrUndefined,
} from '@/utils'
import {
  DATA_RELEASE_STATUS,
  DATA_STATUS,
  EXECUTE_STATUS_TYPE,
  EXECUTE_TYPE_RETRY_STATUS,
  ICON_SELECT_MODE,
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_AUTHORITY,
  SKILL_PACKAGE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import type {ActionDefinition, SearchableColumnType} from '@/types/composables'
import useApp from 'antdv-next/dist/app/useApp'
import LIconSelect from '@/components/basic/IconSelect.vue'

defineOptions({
  name: 'AiServerSkillPackageHome',
})

const {modal, message} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiSkillPackageService()

const columns = computed<SearchableColumnType[]>(() => [
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
    width: 320,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('aiServer.skillPackage.packageKey'),
    dataIndex: 'packageKey',
    key: 'package_key',
    width: 160,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('aiServer.skillPackage.origin'),
    dataIndex: 'origin',
    key: 'origin',
    width: 80,
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
    dataIndex: 'status',
    key: 'status',
    width: 80,
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
    dataIndex: 'type',
    key: 'type',
    width: 80,
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
    title: globalProperties.$t('aiServer.skillPackage.defaultUpdatePolicy'),
    dataIndex: 'defaultUpdatePolicy',
    key: 'default_update_policy',
    width: 120,
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
    title: globalProperties.$t('aiServer.skillPackage.sourceType'),
    dataIndex: 'sourceType',
    key: 'source_type',
    width: 120,
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
    title: globalProperties.$t('common.executeStatus'),
    dataIndex: 'executeStatus',
    key: 'execute_status',
    width: 120,
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
    title: globalProperties.$t('aiServer.skillPackage.latestVersion'),
    dataIndex: 'latestVersion',
    key: 'latest_version',
    width: 120,
    search: {
      component: markRaw(Input),
      props: {placeholder: globalProperties.$t('search.placeholder.input')},
      expression: 'like',
    },
  },
  {
    title: globalProperties.$t('common.group'),
    dataIndex: 'category',
    key: SKILL_GROUP_CODE_PREFIX,
    width: 150,
    search: {
      component: markRaw(Select),
      props: {
        classes: {root: 'w-full'},
        fieldNames: {label: 'name'},
        placeholder: globalProperties.$t('search.placeholder.select'),
      },
      queryName: 'filter_[category.code_jeq]',
    },
  },
])

const options = ref<{
  selectedRows: SkillPackageEntity[]
  query: FilterRequest
}>({
  selectedRows: [],
  query: {},
})

const table = ref()

const snapshotOpen = ref(false)
const snapshotSpinning = ref(false)
const snapshotPackageId = ref<number>()
const snapshotFormRef = ref()
const snapshotForm = ref({
  releaseVersion: '',
  changelog: '',
})

const bulkActions = function (): ActionDefinition<SkillPackageSavePayload>[] {
  return [
    {
      id: 'releaseSelect',
      permission: SKILL_PACKAGE_AUTHORITY.RELEASE,
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
      permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => getRevokeSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.revoke.selected', {
          count: getRevokeSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('loncra-screen-share-off'),
      run: (ctx) => revoke(getRevokeSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
    {
      id: 'reingestSelect',
      permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => getReingestSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('aiServer.skillPackage.reingest.selected', {
          count: getReingestSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('loncra-folder-sync'),
      run: (ctx) => reingest(getReingestSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
  ]
}

const itemActionDefinitions = function (): ActionDefinition<SkillPackageSavePayload>[] {
  return [
    {
      id: 'snapshot',
      permission: SKILL_PACKAGE_AUTHORITY.SNAPSHOT,
      enabled: (ctx) => getEnumValue(ctx.record!.executeStatus ?? 0) === EXECUTE_STATUS_TYPE.SUCCESS,
      label: () => globalProperties.$t('aiServer.skillPackage.snapshot.text'),
      icon: () => createIcon('loncra-package'),
      run: (ctx) => openSnapshot(ctx.record!),
    },
    {
      id: 'release',
      permission: SKILL_PACKAGE_AUTHORITY.RELEASE,
      enabled: (ctx) =>
        getEnumValue(ctx.record!.status) !== DATA_STATUS.RELEASE && Boolean(ctx.record!.latestVersion),
      label: () => globalProperties.$t('common.release.text'),
      icon: () => createIcon('loncra-screen-share'),
      run: (ctx) => release([Number(ctx.record!.id)]),
    },
    {
      id: 'revoke',
      permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => getEnumValue(ctx.record!.status) === DATA_STATUS.RELEASE,
      label: () => globalProperties.$t('common.revoke.text'),
      icon: () => createIcon('loncra-screen-share-off'),
      run: (ctx) => revoke([Number(ctx.record!.id)]),
    },
    {
      id: 'reingest',
      permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
      enabled: (ctx) => EXECUTE_TYPE_RETRY_STATUS.includes(getEnumValue(ctx.record!.executeStatus ?? 0)),
      label: () => globalProperties.$t('aiServer.skillPackage.reingest.text'),
      icon: () => createIcon('loncra-folder-sync'),
      run: (ctx) => reingest([Number(ctx.record!.id)]),
    }
  ]
}

function getReleaseSelectedEntities(selectedRows: SkillPackageSavePayload[]) {
  return selectedRows.filter(
    (e) => DATA_RELEASE_STATUS.includes(getEnumValue(e.status ?? 0)) && Boolean(e.latestVersion),
  )
}

function getReingestSelectedEntities(selectedRows: SkillPackageSavePayload[]) {
  return selectedRows.filter((e) => EXECUTE_TYPE_RETRY_STATUS.includes(getEnumValue(e.executeStatus ?? 0)))
}

function getRevokeSelectedEntities(selectedRows: SkillPackageSavePayload[]) {
  return selectedRows.filter((e) => getEnumValue(e.status ?? 0) === DATA_STATUS.RELEASE)
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

function reingest(ids: number[]) {
  if (ids.length === 0) {
    return
  }
  const content = ids.length === 1
    ? globalProperties.$t('aiServer.skillPackage.reingest.confirmSingle')
    : globalProperties.$t('aiServer.skillPackage.reingest.confirmBatch', {count: ids.length})
  modal.confirm({
    title: globalProperties.$t('aiServer.skillPackage.reingest.confirmTitle'),
    content,
    onOk: () => doReingest(ids),
  })
}

async function doReingest(ids: number[]) {
  try {
    const result: RestResult<void> = await service.reingest(ids)
    message.success(result.message)
    table.value.fetchDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function openSnapshot(record: SkillPackageSavePayload) {
  snapshotPackageId.value = Number(record.id)
  snapshotForm.value = {
    releaseVersion: '',
    changelog: '',
  }
  snapshotOpen.value = true
}

function cancelSnapshot() {
  snapshotFormRef.value?.resetFields?.()
}

async function onSnapshotOk() {
  await snapshotFormRef.value?.validate()
  const packageId = snapshotPackageId.value
  if (!packageId || snapshotSpinning.value) {
    return
  }
  snapshotSpinning.value = true
  try {
    const result: RestResult<number> = await service.snapshot(packageId, {
      releaseVersion: snapshotForm.value.releaseVersion.trim(),
      changelog: snapshotForm.value.changelog.trim() || undefined,
    })
    message.success(result.message)
    snapshotOpen.value = false
    table.value.fetchDataSource()
  } finally {
    snapshotSpinning.value = false
  }
}

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM},
        {id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM},
        {id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS},
      ],
      [SYSTEM_MODULE_NAME.AI_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM},
        {id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM},
        {id: SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM},
      ],
    })
  if (!enums.data) {
    return
  }

  applyColumnOptions(columns.value, 'origin', enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM] || [])
  applyColumnOptions(columns.value, 'type', enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM] || [])
  applyColumnOptions(columns.value, 'defaultUpdatePolicy', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM] || [])
  applyColumnOptions(columns.value, 'sourceType', enums.data[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM] || [])
  applyColumnOptions(columns.value, 'status', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM] || [])
  applyColumnOptions(columns.value, 'executeStatus', enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.EXECUTE_STATUS] || [])

  const dataDictionaryResult: RestResult<Record<string, DataDictionaryMetadata[]>> =
    await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
  if (!dataDictionaryResult.data) {
    return
  }

  for (const key in dataDictionaryResult.data) {
    applyColumnOptions(
      columns.value,
      key,
      (dataDictionaryResult.data[key] || []).map((item) => ({name: item.name, value: item.code})),
    )
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
        add: SKILL_PACKAGE_AUTHORITY.SAVE,
        edit: SKILL_PACKAGE_AUTHORITY.SAVE,
        delete: SKILL_PACKAGE_AUTHORITY.DELETE,
      }"
      :scroll="{x: 'max-content'}"
      :row-selection="{fixed: true, type: 'checkbox'}"
      @add="globalProperties.$router.push({name: SKILL_PACKAGE_ROUTE.ADD})"
      @edit="
        (record) =>
          globalProperties.$router.push({
            name: SKILL_PACKAGE_ROUTE.EDIT,
            query: {id: String(record.id)},
          })
      "
      :actions="bulkActions()"
      :row-actions="itemActionDefinitions()"
    >
      <template #bodyCell="{column, record}">
        <template v-if="column.dataIndex === 'name'">
          <a-space>
            <l-icon-select :mode="ICON_SELECT_MODE.AVATAR" preview :value="record.icon" />
            {{ record.name }}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'category'">
          {{ record.category?.name }}
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
        <template v-if="column.dataIndex === 'defaultUpdatePolicy'">
          {{ getEnumName(record.defaultUpdatePolicy) }}
        </template>
        <template v-if="column.dataIndex === 'sourceType'">
          {{ getEnumName(record.sourceType) }}
        </template>
        <template v-if="column.dataIndex === 'executeStatus'">
          <a-badge :status="getExecuteBadgeStatus(record.executeStatus)" :text="getEnumName(record.executeStatus)" />
        </template>
      </template>
    </l-crud-table>
    <a-modal
      v-model:open="snapshotOpen"
      :title="globalProperties.$t('aiServer.skillPackage.snapshot.title')"
      :ok-text="globalProperties.$t('aiServer.skillPackage.snapshot.text')"
      :confirm-loading="snapshotSpinning"
      :mask-closable="false"
      destroy-on-hidden
      @ok="onSnapshotOk"
      @cancel="cancelSnapshot"
    >
      <l-form id="snapshot-form" ref="snapshotFormRef" :model="snapshotForm" @finish="onSnapshotOk">
        <a-form-item
          name="releaseVersion"
          :label="globalProperties.$t('aiServer.skillPackage.snapshot.releaseVersion')"
          :rules="[{required: true}]"
        >
          <a-input
            v-model:value="snapshotForm.releaseVersion"
            :placeholder="globalProperties.$t('aiServer.skillPackage.snapshot.releaseVersionPlaceholder')"
          />
        </a-form-item>
        <a-form-item
          name="changelog"
          :label="globalProperties.$t('aiServer.skillPackage.snapshot.changelog')"
        >
          <a-textarea
            v-model:value="snapshotForm.changelog"
            :rows="4"
            show-count
            :maxlength="512"
          />
        </a-form-item>
      </l-form>
    </a-modal>
  </div>
</template>
