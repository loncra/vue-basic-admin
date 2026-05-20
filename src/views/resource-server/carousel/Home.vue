<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onActivated,
  onMounted,
  ref
} from "vue";
import type {
  CarouselEntity,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult,
  TotalPage
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
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {MenuProps} from "antdv-next";
import {useConfigProviderStore} from "@/stores/configProviderStore";
import useApp from "antdv-next/dist/app/useApp";
import notFound from '@/assets/404.svg'
import {useFlatDragDrop} from '@/composables'
import type {MenuInfo} from '@v-c/menu'

interface TabDataSource {
  key:string
  label:string
  isLoading: boolean
  loading: boolean
  carouselDataSource: CarouselEntity[]
  cardPage: TotalPage<CarouselEntity>
}

defineOptions({
  name: 'ResourceServerCarouselHome',
})

const { modal, message } = useApp();

const principalStore = usePrincipalStore()
const configProviderStore = useConfigProviderStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const attachmentService = new AttachmentService()
const resourceServerService = new ResourceServerService()
const carouselService = new CarouselService()

const options = ref<{
  typeOptions:NameValueEnumMetadata<number>[]
  loading:boolean
  selectedItem:CarouselEntity[]
}>({
  typeOptions:[],
  loading:false,
  selectedItem:[]
})

const loading = ref<boolean>(false);
const tabActiveKey = ref<string>();
const tabDataSource = ref<TabDataSource[]>([]);

const dragEnabled = computed(() =>
  principalStore.hasPermission('perms[resource_server_data_dictionary:save]'),
)

const currentCardElements = computed({
  get: () =>
    tabDataSource.value.find((t) => t.key === tabActiveKey.value)?.cardPage.elements ?? [],
  set: (val) => {
    const tab = tabDataSource.value.find((t) => t.key === tabActiveKey.value)
    if (tab) {
      tab.cardPage.elements = val
    }
  },
})

const {
  onDragHandleStart,
  onDragHandleEnd,
  buildDropZoneProps,
  dropTargetClass,
} = useFlatDragDrop<CarouselEntity, number>({
  drag: dragEnabled,
  dataSource: currentCardElements,
  direction: 'horizontal',
  formatDragPreview: (entity) => entity.name,
  onFlatDrop: async ({sorts}) => {
    try {
      const result = await carouselService.sort(sorts)
      message.success(result.message)
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  },
})

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

function buildTitleButtons(): NonNullable<MenuProps['items']> {
  const actionButtons:NonNullable<MenuProps['items']> = []
  if (principalStore.hasPermission('perms[resource_server_carousel:save]')) {
    actionButtons.push({
      key: 'add',
      label: globalProperties.$t('common.add',{name:''}),
      icon: () => createIcon('icon-add'),
    })
  }
  if (principalStore.hasPermission('perms[resource_server_carousel:delete]')) {
    const count = getReleaseSelectedEntities().length;
    actionButtons.push({
      key: 'deleteSelect',
      label: globalProperties.$t('common.delete.selected',{count}),
      disabled: count === 0,
      icon: () => createIcon('icon-delete'),
    })
  }
  if (principalStore.hasPermission('perms[resource_server_carousel:release]')) {
    const count = getReleaseSelectedEntities().length;
    actionButtons.push({
      key: 'releaseSelect',
      label: globalProperties.$t('common.release.selected',{count}),
      disabled: count === 0,
      icon: () => createIcon('icon-response'),
    })
  }
  if (principalStore.hasPermission('perms[resource_server_carousel:revoke]')) {
    const count = getRevokeSelectedEntities().length;
    actionButtons.push({
      key: 'revokeSelect',
      label: globalProperties.$t('common.revoke.selected',{count}),
      disabled: count === 0,
      icon: () => createIcon('icon-time-response'),
    })
  }
  return actionButtons;
}


function getReleaseSelectedEntities() {
  return options.value.selectedItem.filter(e => [10, 30].includes(getEnumValue(e.status ?? 0)))
}

function getRevokeSelectedEntities() {
  return options.value.selectedItem.filter(e => [20].includes(getEnumValue(e.status ?? 0)))
}

function buildMenuProps(entity: CarouselEntity): MenuProps {
  const status = getEnumValue(entity.status ?? 0)
  return {
    items: [
      {
        key: 'release',
        label: globalProperties.$t('common.release.text'),
        icon: () => createIcon('icon-response'),
        disabled: status === 20,
      },
      {
        key: 'revoke',
        label: globalProperties.$t('common.revoke.text'),
        icon: () => createIcon('icon-time-response'),
        disabled: status === 30,
      },
      {
        key: 'edit',
        label: globalProperties.$t('common.edit'),
        icon: () => createIcon('icon-edit'),
        disabled: status === 20,
      },
    ],
  }
}

async function loadDataSource(
  dataSource:TabDataSource,
  number:number = 1,
  size:number = 10
):Promise<void> {
  if (!dataSource) {
    return
  }
  dataSource.loading = true;
  const carouselDataSource:RestResult<TotalPage<CarouselEntity>> = await carouselService.page({
    "number": -1,
    "filter_[type_eq]":dataSource.key,
    "filter_[status_eq]":20,
  })
  if (carouselDataSource.data) {
    dataSource.carouselDataSource = carouselDataSource.data.elements;
  }
  const page:RestResult<TotalPage<CarouselEntity>> = await carouselService.page({
    "number": number,
    "size": size,
    "filter_[type_eq]":dataSource.key,
  })
  if (page.data) {
    dataSource.cardPage = page.data;
  }
  dataSource.loading = false;
}

function onChangeTab(key:string):void {
  tabActiveKey.value = key;
  const dataSource = tabDataSource.value.find(s => s.key === key);
  if (dataSource && !dataSource.isLoading) {
    loadDataSource(dataSource);
    dataSource.isLoading = true;
  }
}

function onActionItemClick(key:string, id:string) {
  if (key === 'add') {
    globalProperties.$router.push({name:'resource_server_carousel_add'})
  } else if (key === 'edit') {
    globalProperties.$router.push({name:'resource_server_carousel_edit', query:{id:id}})
  } else if (key === 'delete') {
    remove([Number(id)])
  } else if (key === 'deleteSelect') {
    remove(options.value.selectedItem.map(e => Number(e.id)))
  } else if (key === 'release') {
    release([Number(id)])
  } else if (key === 'revoke') {
    revoke([Number(id)])
  } else if (key === 'releaseSelect') {
    release(options.value.selectedItem.map(e => Number(e.id)))
  } else if (key === 'revokeSelect') {
    revoke(options.value.selectedItem.map(e => Number(e.id)))
  }
}
function release(ids: number[]) {
  if (ids.length === 0) {
    return
  }
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
    const result:RestResult<void> = await carouselService.release(ids)
    message.success(result.message)
    options.value.selectedItem = []
    const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (dataSource){
      await loadDataSource(dataSource)
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
    const result:RestResult<void> = await carouselService.revoke(ids)
    message.success(result.message)
    options.value.selectedItem = []
    const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (dataSource){
      await loadDataSource(dataSource)
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function remove(ids: number[]) {
  if (ids.length === 0) {
    return
  }
  const content = ids.length === 1
      ? globalProperties.$t('common.delete.confirmSingle')
      : globalProperties.$t('common.delete.confirmBatch', {count: ids.length})
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content,
    onOk: () => doDelete(ids),
  })
}

async function doDelete(ids: number[]) {
  try {
    const result:RestResult<void> = await carouselService.delete(ids)
    message.success(result.message)
    const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value)
    if (dataSource){
      await loadDataSource(dataSource)
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
}

function onSelect(entity: CarouselEntity) {
  if (options.value.selectedItem.some(e => e.id === entity.id)) {
    options.value.selectedItem = options.value.selectedItem.filter(e => e.id !== entity.id)
  } else {
    options.value.selectedItem.push(entity)
  }
}

async function mounted() {
  loading.value = true

  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"CarouselTypeEnum"}]})
  if (enums.data) {
    options.value.typeOptions = enums.data['resource-server']?.CarouselTypeEnum as NameValueEnumMetadata<number>[]
    for (const item of options.value.typeOptions) {
      tabDataSource.value.push({
        key: String(item.value),
        label: item.name,
        loading:false,
        carouselDataSource: [],
        isLoading: false,
        cardPage: {
          number: 1,
          size: 10,
          elements: [],
          totalPages: 0,
          totalCount: 0,
          first: true,
          numberOfElements: 0,
          last: true
        }
      })
    }
  }

  if (tabDataSource.value.length > 0) {
    tabActiveKey.value = tabDataSource.value.at(0)?.key
    loadDataSource(tabDataSource.value.at(0) as TabDataSource);
  }

  loading.value = false
}

function activated() {
  if (tabActiveKey.value) {
    loadDataSource(tabDataSource.value.find(t => t.key === tabActiveKey.value) as TabDataSource);
  }
}

function onChangePage(page: number, pageSize: number) {
  if (tabActiveKey.value) {
  const dataSource = tabDataSource.value.find(t => t.key === tabActiveKey.value);
    if (dataSource) {
      loadDataSource(dataSource, page, pageSize);
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
          <a-spin :spinning="item.loading" size="large">
            <a-space orientation="vertical" class="w-full" :size="configProviderStore.getToken().sizeMD">
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

              <a-card size="small" :title="(item?.label || '') + globalProperties.$t('resourceServer.carousel.dataContent')" >
                <template #extra>
                  <l-action-button size="small" :action-items="buildTitleButtons()" @action-item-click="(key:string) => onActionItemClick(key, null as unknown as string)"/>
                </template>
                <a-empty v-if="(item?.cardPage?.elements || []).length <= 0"/>

                <a-card-grid
                  v-bind="buildDropZoneProps(entity)"
                  @click="onSelect(entity)"
                  v-else
                  :class="[
                    'w-1/5',
                    options.selectedItem.some(e => e.id === entity.id) ? 'bg-info-bg' : '',
                    dropTargetClass(entity),
                  ]"
                  :key="entity.id"
                  v-for="entity of item?.cardPage?.elements || []"
                >
                  <a-badge-ribbon
                    :text="getEnumName(entity.status)"
                    :color="statusSetting[String(entity.status.value) as keyof typeof statusSetting]?.color || 'blue'"
                  >

                    <a-tooltip>
                      <template #title>
                        <a-space orientation="vertical">
                          <span>{{globalProperties.$t('resourceServer.carousel.showtime')}}: {{entity.showtime ? dateTimeFormat(entity.showtime) : globalProperties.$t('resourceServer.carousel.immediately')}}</span>
                          <span>{{globalProperties.$t('common.expiresTime')}}: {{entity.expirationTime ? dateTimeFormat(entity.expirationTime) : globalProperties.$t('resourceServer.carousel.permanent') }}</span>
                        </a-space>
                      </template>
                      <a-card size="small" :title="entity.name">
                        <template #cover >
                          <a-image
                            @click.stop
                            :src="attachmentService.query(entity?.cover?.bucketName, entity?.cover?.objectName)"
                            :fallback="notFound"
                          />
                        </template>

                        <template #actions>
                          <a-dropdown
                            @menu-click="(e: MenuInfo) => onActionItemClick(e.key, entity.id)"
                            @click.stop
                            :menu="buildMenuProps(entity)"
                            placement="bottomLeft"
                          >
                            <a-button
                              size="small"
                              type="text"
                            >
                              <template #icon>
                                <icon-font class="icon" type="icon-more" />
                              </template>
                            </a-button>
                          </a-dropdown>
                          <div
                            v-if="dragEnabled"
                            class="text-center cursor-grab"
                            draggable="true"
                            @click.stop
                            @dragstart="onDragHandleStart(entity, $event)"
                            @dragend="onDragHandleEnd"
                          >
                            <a-typography-text type="secondary">
                              ::
                            </a-typography-text>
                          </div>
                          <a-button @click.stop="onActionItemClick('delete', entity.id)" size="small" type="text" :disabled="!principalStore.hasPermission('perms[resource_server_data_dictionary:delete]')">
                            <icon-font class="icon" type="icon-delete"></icon-font>
                          </a-button>
                        </template>
                      </a-card>
                    </a-tooltip>
                  </a-badge-ribbon>
                </a-card-grid>
              </a-card>

              <a-pagination @change="onChangePage" hide-on-single-page :current="item?.cardPage?.number" :pageSize="item?.cardPage?.size" :total="item?.cardPage?.totalCount" align="center"/>
            </a-space>
          </a-spin>
        </template>
      </a-tabs>

    </l-menu-title-card>
  </div>
</template>
