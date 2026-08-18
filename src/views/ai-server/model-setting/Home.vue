<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LCrudTable from '@/components/basic/crud/CrudTable.vue'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  onActivated,
  onMounted,
  ref,
} from 'vue'
import {App, Input, type MenuProps, Select} from 'antdv-next'
import type {
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  FilterRequest,
  ModelSettingEntity,
  NameValueEnumMetadata,
  RestResult,
  TreeSortMetadata,
} from '@/types/apis'
import {ModelSettingService} from '@/apis/ai-server/modelSettingService.ts'
import {ResourceServerService} from '@/apis'
import {getEnumName, requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {
  AI_SERVER_MODEL_SETTING_AUTHORITY,
  AI_SERVER_MODEL_SETTING_ROUTE,
  MODEL_SETTING_MANUFACTURER_CODE_PREFIX,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  SYSTEM_CONSTANT,
} from '@/constants'
import type {SearchableColumnType} from "@/types/composables";

const {message} = App.useApp()

defineOptions({
  name: 'AiServerModelSettingHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const modelSettingService = new ModelSettingService()

const modelSettingTable = ref()
const manufacturers = ref<DataDictionaryMetadata[]>([])
const manufacturersLoading = ref(false)
const selectedManufacturer = ref<DataDictionaryMetadata | null>(null)
const selectedKeys = ref<string[]>([])

const options = ref<{
  selectedRows: ModelSettingEntity[]
  typeOptions: NameValueEnumMetadata<number>[]
  enabledOptions: NameValueEnumMetadata<number>[]
  columns: SearchableColumnType[]
  query: FilterRequest
}>({
  selectedRows: [],
  typeOptions: [],
  enabledOptions: [],
  columns: [
    {
      title: globalProperties.$t('common.name'),
      dataIndex: 'name',
      key: 'name',
      search: {
        component: markRaw(Input),
        props: {placeholder: globalProperties.$t('search.placeholder.input')},
        expression: 'like',
      },
    },
    {
      title: globalProperties.$t('aiServer.modelSetting.model'),
      dataIndex: 'model',
      key: 'model',
      search: {
        component: markRaw(Input),
        props: {placeholder: globalProperties.$t('search.placeholder.input')},
        expression: 'like',
      },
    },
    {
      title: globalProperties.$t('common.type'),
      dataIndex: 'type',
      key: 'type',
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
      title: globalProperties.$t('common.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
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
  ],
  query: {},
})

const modelSettingActionContextExtras = computed(() => ({
  titleActionsEnabled: selectedManufacturer.value !== null,
}))

const dragEnabled = computed(() =>
  principalStore.hasPermission(AI_SERVER_MODEL_SETTING_AUTHORITY.SORT),
)

const manufacturerMenuItems = computed(() =>
  manufacturers.value.map((item) => ({
    key: item.code,
    label: item.name,
    iconType: String(item.metadata?.icon || 'loncra-building'),
  })),
)

function selectManufacturer(item: DataDictionaryMetadata) {
  selectedManufacturer.value = item
  selectedKeys.value = [item.code]
  options.value.query['filter_[manufacturer.code_jeq]'] = item.code
  modelSettingTable.value?.fetchDataSource()
}

const onManufacturerMenuClick: MenuProps['onClick'] = (info) => {
  const item = manufacturers.value.find((row) => row.code === String(info.key))
  if (item) {
    selectManufacturer(item)
  }
}

async function loadManufacturers() {
  manufacturersLoading.value = true
  try {
    const result:RestResult<Record<string, DataDictionaryMetadata[]>> = await ResourceServerService.findDataDictionariesByCodes([MODEL_SETTING_MANUFACTURER_CODE_PREFIX])
    manufacturers.value = result.data?.[MODEL_SETTING_MANUFACTURER_CODE_PREFIX] || []
  } finally {
    manufacturersLoading.value = false
  }
}

/** 对齐字典页：仅从 Form 返回的 query 恢复选中，左侧点击不改 URL */
async function activated(manufacturerCode?: string | null) {
  if (!manufacturerCode) {
    return
  }
  if (!manufacturers.value.length) {
    await loadManufacturers()
  }
  const target = manufacturers.value.find((item) => item.code === manufacturerCode)
  if (!target) {
    return
  }
  selectManufacturer(target)
}

function formatDragPreview(record: ModelSettingEntity) {
  return record.name
}

async function onDrop(
  sorts: TreeSortMetadata<ModelSettingEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
) {
  const result: RestResult<void> = await modelSettingService.sort(sorts)
  message.success(result.message)
}

function onAdd() {
  if (!selectedManufacturer.value) {
    return
  }
  void globalProperties.$router.push({
    name: AI_SERVER_MODEL_SETTING_ROUTE.ADD,
    query: {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: selectedManufacturer.value.code},
  })
}

async function mounted() {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      'ai-server': [{id: 'ModelTypeEnum'}],
      'resource-server': [{id: 'YesOrNo'}],
    })
  if (enums.data) {
    options.value.typeOptions = (enums.data['ai-server']?.ModelTypeEnum ||
      []) as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = (enums.data['resource-server']?.YesOrNo ||
      []) as NameValueEnumMetadata<number>[]

    const typeCol = options.value.columns?.find((c) => c && 'dataIndex' in c && c.dataIndex === 'type')
    if (typeCol && 'search' in typeCol && typeCol.search) {
      typeCol.search.props = typeCol.search.props ?? {}
      typeCol.search.props.options = options.value.typeOptions
    }
    const enabledCol = options.value.columns?.find(
      (c) => c && 'dataIndex' in c && c.dataIndex === 'enabled',
    )
    if (enabledCol && 'search' in enabledCol && enabledCol.search) {
      enabledCol.search.props = enabledCol.search.props ?? {}
      enabledCol.search.props.options = options.value.enabledOptions
    }
  }

  await loadManufacturers()
  await activated(
    globalProperties.$route.query[MODEL_SETTING_MANUFACTURER_CODE_QUERY] as string,
  )
}

onActivated(() => {
  void activated(
    globalProperties.$route.query[MODEL_SETTING_MANUFACTURER_CODE_QUERY] as string,
  )
})

onMounted(mounted)
</script>

<template>
  <div>
    <l-menu-title-card :classes="{body: 'pt-1 pr-0 pl-0 pb-0'}">
      <a-splitter>
        <a-splitter-panel default-size="20%" min="15%" max="25%">
          <a-flex vertical class="h-full min-h-0">
            <a-flex justify="space-between" align="center" class="px-md py-sm">
              <a-space>
                <icon-font icon="icon align" type="loncra-building" />
                <a-typography-text strong>
                  {{ globalProperties.$t('aiServer.modelSetting.manufacturer') }}
                </a-typography-text>
              </a-space>
            </a-flex>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <a-spin :spinning="manufacturersLoading" class="size-full-spin">
                <a-menu
                  root-class="border-none"
                  mode="inline"
                  v-model:selected-keys="selectedKeys"
                  :items="manufacturerMenuItems"
                  @click="onManufacturerMenuClick"
                >
                  <template #iconRender="item">
                    <icon-font icon="icon align" :type="item.iconType" />
                  </template>
                </a-menu>
                <a-empty v-if="!manufacturersLoading && manufacturers.length === 0" />
              </a-spin>
            </div>
          </a-flex>
        </a-splitter-panel>

        <a-splitter-panel>
          <l-crud-table
            ref="modelSettingTable"
            :drag="dragEnabled"
            :format-drag-preview="formatDragPreview"
            :action-context-extras="modelSettingActionContextExtras"
            :bordered="false"
            :pagination="false"
            :immediate="false"
            v-model:query="options.query"
            v-model:selected-rows="options.selectedRows"
            :service="modelSettingService"
            :columns="options.columns"
            :authority="{
              add: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
              edit: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
              delete: AI_SERVER_MODEL_SETTING_AUTHORITY.DELETE,
              detail: AI_SERVER_MODEL_SETTING_AUTHORITY.GET,
            }"
            :scroll="{x: 'max-content'}"
            :row-selection="{fixed: true, type: 'checkbox'}"
            @drop="onDrop"
            @add="onAdd"
            @detail="r => globalProperties.$router.push({name: AI_SERVER_MODEL_SETTING_ROUTE.DETAIL,query: {id: String(r.id)},})"
            @edit="r =>globalProperties.$router.push({name: AI_SERVER_MODEL_SETTING_ROUTE.EDIT,query: {id: String(r.id)},})
            "
          >
            <template #title>
              <a-flex justify="space-between" align="center">
                <a-space>
                  <icon-font icon="icon align" type="loncra-sticker" />
                  <a-typography-text strong>
                    {{ globalProperties.$t('aiServer.modelSetting.routePage') }}
                    <template v-if="selectedManufacturer">
                      ({{ selectedManufacturer.name }})
                    </template>
                  </a-typography-text>
                </a-space>
              </a-flex>
            </template>

            <template #bodyCell="{column, record}">
              <template v-if="column.dataIndex === 'name'">
                <a-space>
                  <icon-font
                    icon="icon align"
                    :type="record.icon || 'loncra-sticker'"
                  />
                  <span>{{ record.name }}</span>
                </a-space>
              </template>
              <template v-if="column.dataIndex === 'type'">
                {{ getEnumName(record.type) }}
              </template>
              <template v-if="column.dataIndex === 'enabled'">
                {{ getEnumName(record.enabled) }}
              </template>
            </template>
          </l-crud-table>
        </a-splitter-panel>
      </a-splitter>
    </l-menu-title-card>
  </div>
</template>
