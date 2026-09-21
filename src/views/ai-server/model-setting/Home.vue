<script setup lang="ts">
import {computed, onActivated, onMounted, ref} from 'vue'
import {App, type MenuProps} from 'antdv-next'
import {useRoute} from 'vue-router'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import type {ModelSettingEntity} from '@loncra/client/ai'
import type {FilterRequest, RestResult, TreeSortMetadata} from '@loncra/client/commons'
import {ResourceServerService} from '@/apis'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import router from '@/routers'
import {
  AI_SERVER_MODEL_SETTING_AUTHORITY,
  AI_SERVER_MODEL_SETTING_ROUTE,
  MODEL_SETTING_MANUFACTURER_CODE_PREFIX,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  SYSTEM_CONSTANT,
} from '@/constants'
import {modelSettingService} from './model-setting.page'
import {modelSettingHomePage, selectedManufacturer} from './model-setting.home.page'

defineOptions({
  name: 'AiServerModelSettingHome',
})

const {message} = App.useApp()
const route = useRoute()
const principalStore = usePrincipalStore()

const table = ref<CrudHomePageExpose<ModelSettingEntity>>()
const query = ref<FilterRequest>({})
const manufacturers = ref<DataDictionaryMetadata[]>([])
const manufacturersLoading = ref(false)
const selectedKeys = ref<string[]>([])

const dragEnabled = computed(() =>
  principalStore.hasPermission(AI_SERVER_MODEL_SETTING_AUTHORITY.SORT),
)

/** 左树：厂商 = 数据字典（`manufacturerCode`） */
const manufacturerMenuItems = computed(() =>
  manufacturers.value.map((item) => ({
    key: item.code,
    label: item.name,
    iconType: String(item.metadata?.icon || 'loncra-building'),
  })),
)

function selectManufacturer(item: DataDictionaryMetadata): void {
  selectedManufacturer.value = item
  selectedKeys.value = [item.code]
  query.value['filter_[manufacturer.code_jeq]'] = item.code
  void table.value?.fetchDataSource()
}

const onManufacturerMenuClick: MenuProps['onClick'] = (info) => {
  const item = manufacturers.value.find((row) => row.code === String(info.key))
  if (item) {
    selectManufacturer(item)
  }
}

async function loadManufacturers(): Promise<void> {
  manufacturersLoading.value = true
  try {
    const result: RestResult<Record<string, DataDictionaryMetadata[]>> =
      await ResourceServerService.findDataDictionariesByCodes([MODEL_SETTING_MANUFACTURER_CODE_PREFIX])
    manufacturers.value = result.data?.[MODEL_SETTING_MANUFACTURER_CODE_PREFIX] || []
  } finally {
    manufacturersLoading.value = false
  }
}

/** 对齐字典页：仅从 Form 返回的 query 恢复选中，左侧点击不改 URL */
async function activated(manufacturerCode?: string | null): Promise<void> {
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

/** 拖拽幽灵内容（`@drag` 与 `@drop` 都用宿主自己的状态，所以留在壳里） */
function formatDragPreview(record: ModelSettingEntity): string {
  return record.name
}

async function onDrop(
  sorts: TreeSortMetadata<ModelSettingEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
): Promise<void> {
  const result: RestResult<void> = await modelSettingService.sort(sorts)
  void message.success(result.message)
}

/** 新增要带上当前厂商（pro 的默认跳转只拼 `{id}`）⇒ 壳绑 `@add` 接管 */
function onAdd(): void {
  const manufacturer = selectedManufacturer.value
  if (!manufacturer) {
    return
  }
  void router.push({
    name: AI_SERVER_MODEL_SETTING_ROUTE.ADD,
    query: {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: manufacturer.code},
  })
}

async function mounted(): Promise<void> {
  await loadManufacturers()
  await activated(route.query[MODEL_SETTING_MANUFACTURER_CODE_QUERY] as string)
}

onActivated(() => {
  void activated(route.query[MODEL_SETTING_MANUFACTURER_CODE_QUERY] as string)
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
                  {{ $t('aiServer.modelSetting.manufacturer') }}
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
          <l-crud-home-page
            ref="table"
            v-model:query="query"
            :page="modelSettingHomePage"
            :immediate="false"
            :pagination="false"
            :bordered="false"
            :drag="dragEnabled ? formatDragPreview : false"
            :scroll="{x: 'max-content'}"
            @drop="onDrop"
            @add="onAdd"
          >
            <template #title>
              <a-flex justify="space-between" align="center">
                <a-space>
                  <icon-font icon="icon align" type="loncra-sticker" />
                  <a-typography-text strong>
                    {{ $t('aiServer.modelSetting.routePage') }}
                    <template v-if="selectedManufacturer">
                      ({{ selectedManufacturer.name }})
                    </template>
                  </a-typography-text>
                </a-space>
              </a-flex>
            </template>
          </l-crud-home-page>
        </a-splitter-panel>
      </a-splitter>
    </l-menu-title-card>
  </div>
</template>
