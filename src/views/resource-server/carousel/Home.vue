<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import LCrudCardGrid from "@/components/basic/CrudCardGrid.vue";
import LActionButton from "@/components/basic/ActionButton.vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onActivated,
  onMounted,
  ref
} from "vue";
import type {
  CarouselEntity,
  EnumBucketsResponseBody,
  FlatSortMetadata,
  NameValueEnumMetadata,
  PageRequest,
  RestResult,
} from "@/types/apis";
import {AttachmentService, ResourceServerService} from "@/apis";
import {CarouselService} from "@/apis/resource-server/carouselService.ts";
import {
  createIcon,
  dateTimeFormat,
  getEnumName,
  getEnumValue,
  requireNonNullOrUndefined
} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore";
import useApp from "antdv-next/dist/app/useApp";
import notFound from '@/assets/404.svg'
import type {ActionDefinition} from '@/types/composables'

interface TabDataSource {
  key: string
  label: string
  isLoading: boolean
  previewLoading: boolean
  carouselDataSource: CarouselEntity[]
  selectedItems: CarouselEntity[]
  query: PageRequest
}

defineOptions({
  name: 'ResourceServerCarouselHome',
})

const { modal, message } = useApp();

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const attachmentService = new AttachmentService()
const resourceServerService = new ResourceServerService()
const carouselService = new CarouselService()

const carouselAuthority = {
  add: 'perms[resource_server_carousel:save]',
  edit: 'perms[resource_server_carousel:save]',
  delete: 'perms[resource_server_carousel:delete]',
  detail: false,
} as const

const options = ref<{
  typeOptions: NameValueEnumMetadata<number>[]
  loading: boolean
}>({
  typeOptions: [],
  loading: false,
})

const tabActiveKey = ref<string>();
const tabDataSource = ref<TabDataSource[]>([]);

interface CarouselGridExposed {
  fetchDataSource: () => Promise<void | undefined>
  remove: (records: CarouselEntity[]) => void
}

const gridRefs = new Map<string, CarouselGridExposed>()

const dragEnabled = computed(() =>
  principalStore.hasPermission('perms[resource_server_carousel:save]'),
)

const statusSetting = {
  "10": {
    color: "blue"
  },
  "30": {
    color: "yellow"
  },
  "20": {
    color: "green"
  }
} as const

function setGridRef(key: string, el: unknown) {
  if (el) {
    gridRefs.set(key, el as CarouselGridExposed)
  } else {
    gridRefs.delete(key)
  }
}

function getReleaseSelectedEntities(selectedRows: CarouselEntity[]) {
  return selectedRows.filter(e => [10, 30].includes(getEnumValue(e.status ?? 0)))
}

function getRevokeSelectedEntities(selectedRows: CarouselEntity[]) {
  return selectedRows.filter(e => [20].includes(getEnumValue(e.status ?? 0)))
}

function createBulkActions(): ActionDefinition<CarouselEntity>[] {
  return [
    {
      id: 'add',
      permission: carouselAuthority.add,
      label: () => globalProperties.$t('common.add', {name: ''}),
      icon: () => createIcon('icon-add'),
      run: () => {
        void globalProperties.$router.push({name: 'resource_server_carousel_add'})
      },
    },
    {
      id: 'deleteSelected',
      permission: carouselAuthority.delete,
      enabled: (ctx) => getReleaseSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.delete.selected', {
          count: getReleaseSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('icon-delete'),
      run: (ctx) => {
        const tab = tabDataSource.value.find((t) => t.key === tabActiveKey.value)
        if (tab) {
          gridRefs.get(tab.key)?.remove(getReleaseSelectedEntities(ctx.selectedItems))
        }
      },
    },
    {
      id: 'releaseSelect',
      permission: 'perms[resource_server_carousel:release]',
      enabled: (ctx) => getReleaseSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.release.selected', {
          count: getReleaseSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('icon-response'),
      run: (ctx) => release(getReleaseSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
    {
      id: 'revokeSelect',
      permission: 'perms[resource_server_carousel:revoke]',
      enabled: (ctx) => getRevokeSelectedEntities(ctx.selectedItems).length > 0,
      label: (ctx) =>
        globalProperties.$t('common.revoke.selected', {
          count: getRevokeSelectedEntities(ctx.selectedItems).length,
        }),
      icon: () => createIcon('icon-time-response'),
      run: (ctx) => revoke(getRevokeSelectedEntities(ctx.selectedItems).map((e) => Number(e.id))),
    },
  ]
}

function createItemActions(): ActionDefinition<CarouselEntity>[] {
  return [
    {
      id: 'release',
      permission: 'perms[resource_server_carousel:release]',
      enabled: (ctx) => getEnumValue(ctx.record!.status ?? 0) !== 20,
      label: () => globalProperties.$t('common.release.text'),
      icon: () => createIcon('icon-response'),
      run: (ctx) => release([Number(ctx.record!.id)]),
    },
    {
      id: 'revoke',
      permission: 'perms[resource_server_carousel:revoke]',
      enabled: (ctx) => getEnumValue(ctx.record!.status ?? 0) !== 30,
      label: () => globalProperties.$t('common.revoke.text'),
      icon: () => createIcon('icon-time-response'),
      run: (ctx) => revoke([Number(ctx.record!.id)]),
    },
    {
      id: 'edit',
      permission: carouselAuthority.edit,
      enabled: (ctx) => getEnumValue(ctx.record!.status ?? 0) !== 20,
      label: () => globalProperties.$t('common.edit'),
      icon: () => createIcon('icon-edit'),
      run: (ctx) => {
        void globalProperties.$router.push({
          name: 'resource_server_carousel_edit',
          query: {id: String(ctx.record!.id)},
        })
      },
    },
  ]
}

const bulkActions = createBulkActions()
const itemActionDefinitions = createItemActions()

async function loadCarouselPreview(tab: TabDataSource): Promise<void> {
  const carouselDataSource: RestResult<{elements: CarouselEntity[]}> = await carouselService.page({
    number: -1,
    'filter_[type_eq]': tab.key,
    'filter_[status_eq]': 20,
  })
  if (carouselDataSource.data) {
    tab.carouselDataSource = carouselDataSource.data.elements
  }
}

async function loadCarouselPreviewWithLoading(tab: TabDataSource): Promise<void> {
  tab.previewLoading = true
  try {
    await loadCarouselPreview(tab)
  } finally {
    tab.previewLoading = false
  }
}

async function loadTabData(tab: TabDataSource): Promise<void> {
  await loadCarouselPreviewWithLoading(tab)
  await nextTick()
  let grid = gridRefs.get(tab.key)
  if (!grid) {
    await nextTick()
    grid = gridRefs.get(tab.key)
  }
  if (!grid) {
    console.warn(`[carousel] grid ref not found for tab: ${tab.key}`)
  } else {
    await grid.fetchDataSource()
  }
}

function onChangeTab(key: string): void {
  tabActiveKey.value = key
  const dataSource = tabDataSource.value.find(s => s.key === key)
  if (dataSource && !dataSource.isLoading) {
    dataSource.isLoading = true
    void loadTabData(dataSource)
  }
}

async function onGridDeleted() {
  const tab = tabDataSource.value.find((t) => t.key === tabActiveKey.value)
  if (tab) {
    tab.selectedItems = []
    await loadTabData(tab)
  }
}

async function onCardDrop(sorts: FlatSortMetadata<number>[]) {
  try {
    const result = await carouselService.sort(sorts)
    message.success(result.message)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
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
    const result: RestResult<void> = await carouselService.release(ids)
    message.success(result.message)
    const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (dataSource) {
      dataSource.selectedItems = []
      await loadTabData(dataSource)
    }
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
    const result: RestResult<void> = await carouselService.revoke(ids)
    message.success(result.message)
    const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (dataSource) {
      dataSource.selectedItems = []
      await loadTabData(dataSource)
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

async function mounted() {
  options.value.loading = true

  const enums: RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({
    'resource-server': [{id: 'CarouselTypeEnum'}],
  })
  if (enums.data) {
    options.value.typeOptions = enums.data['resource-server']?.CarouselTypeEnum as NameValueEnumMetadata<number>[]
    for (const item of options.value.typeOptions) {
      tabDataSource.value.push({
        key: String(item.value),
        label: item.name,
        previewLoading: false,
        carouselDataSource: [],
        isLoading: false,
        selectedItems: [],
        query: {
          number: 1,
          size: 10,
          'filter_[type_eq]': String(item.value),
        },
      })
    }
  }

  if (tabDataSource.value.length > 0) {
    const firstTab = tabDataSource.value.at(0) as TabDataSource
    tabActiveKey.value = firstTab.key
    firstTab.isLoading = true
    await loadTabData(firstTab)
  }

  options.value.loading = false
}

function activated() {
  if (tabActiveKey.value) {
    const tab = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (tab) {
      void loadTabData(tab)
    }
  }
}

onMounted(mounted)

onActivated(activated)
</script>

<template>
  <div>
    <l-menu-title-card :loading="options.loading">
      <a-tabs
        v-model:active-key="tabActiveKey"
        centered
        @change="onChangeTab"
        :items="tabDataSource"
      >
        <template #contentRender="{item}">
          <a-space orientation="vertical" class="w-full" :size="configProviderStore.getToken().sizeMD">
            <a-spin :spinning="item.previewLoading">
              <template v-if="(item.carouselDataSource || []).length <= 0">
                <a-empty />
              </template>

              <a-carousel v-else :autoplay="{ dotDuration: true }" :autoplay-speed="5000" arrows>
                <div
                  class="text-center bg-fill-secondary"
                  :key="entity.id"
                  v-for="entity of item?.carouselDataSource || []"
                >
                  <a-image
                    :preview="false"
                    :src="attachmentService.query(entity?.cover?.bucketName, entity?.cover?.objectName)"
                    :fallback="notFound"
                  />
                </div>
              </a-carousel>
            </a-spin>

            <l-crud-card-grid
              :ref="(el) => setGridRef(item.key, el)"
              :key="item.key"
              :service="carouselService"
              v-model:query="item.query"
              v-model:selected-items="item.selectedItems"
              :immediate="false"
              :drag="dragEnabled"
              :authority="carouselAuthority"
              :actions="bulkActions"
              :item-actions="itemActionDefinitions"
              @deleted="onGridDeleted"
              @drop="onCardDrop"
            >
              <template #title>
                {{ item.label }}{{ globalProperties.$t('resourceServer.carousel.dataContent') }}
              </template>
              <template #item="{ record, itemActions, dragEnabled: itemDragEnabled, onDragStart, onDragEnd }">
                <a-badge-ribbon
                  :text="getEnumName(record.status)"
                  :color="statusSetting[String(getEnumValue(record.status ?? 0)) as keyof typeof statusSetting]?.color || 'blue'"
                >
                  <a-tooltip>
                    <template #title>
                      <a-space orientation="vertical">
                        <span>{{ globalProperties.$t('resourceServer.carousel.showtime') }}: {{ record.showtime ? dateTimeFormat(record.showtime) : globalProperties.$t('resourceServer.carousel.immediately') }}</span>
                        <span>{{ globalProperties.$t('common.expiresTime') }}: {{ record.expirationTime ? dateTimeFormat(record.expirationTime) : globalProperties.$t('resourceServer.carousel.permanent') }}</span>
                      </a-space>
                    </template>
                    <a-card size="small" :title="record.name">
                      <template #cover>
                        <a-image
                          @click.stop
                          :src="attachmentService.query(record.cover?.bucketName ?? '', record.cover?.objectName ?? '')"
                          :fallback="notFound"
                        />
                      </template>
                      <template #actions>
                        <l-action-button
                          size="small"
                          type="text"
                          always-dropdown
                          :actions="itemActions"
                          @click.stop
                        />
                        <div
                          v-if="itemDragEnabled"
                          class="text-center cursor-grab"
                          draggable="true"
                          @click.stop
                          @dragstart="onDragStart($event)"
                          @dragend="onDragEnd"
                        >
                          <a-typography-text type="secondary">
                            ::
                          </a-typography-text>
                        </div>
                      </template>
                    </a-card>
                  </a-tooltip>
                </a-badge-ribbon>
              </template>
            </l-crud-card-grid>
          </a-space>
        </template>
      </a-tabs>
    </l-menu-title-card>
  </div>
</template>
