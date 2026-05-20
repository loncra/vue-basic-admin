<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {
  CarouselEntity,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult,
  TotalPage
} from "@/types/apis";
import {AttachmentService, ResourceServerService} from "@/apis";
import {CarouselService} from "@/apis/resource-server/carouselService.ts";
import {createIcon, dateTimeFormat, getEnumName, requireNonNullOrUndefined} from "@/utils";
import LActionButton from "@/components/basic/ActionButton.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {MenuProps} from "antdv-next";
import {useConfigProviderStore} from "@/stores/configProviderStore";
import useApp from "antdv-next/dist/app/useApp";
import notFound from '@/assets/404.svg'

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
  actionButtons:NonNullable<MenuProps['items']>
  loading:boolean
  selectedItem:CarouselEntity[]
}>({
  typeOptions:[],
  actionButtons:[],
  loading:false,
  selectedItem:[]
})

const loading = ref<boolean>(false);
const tabActiveKey = ref<string>();
const tabDataSource = ref<TabDataSource[]>([]);

const statusSetting = {
  "10": {
    color: "blue"
  },
  "15": {
    color: "lime"
  },
  "20": {
    color: "green"
  }
} as const

async function loadDataSource(dataSource:TabDataSource):Promise<void> {
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
    "number": 1,
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
  }
}

function remove(ids: number[]) {
  if (ids.length === 0) {
    return
  }
  const content =
  ids.length === 1
      ? globalProperties.$t('common.delete.confirmSingle')
      : globalProperties.$t('common.delete.confirmBatch', {count: ids.length})
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content,
    onOk: () => doDelete(ids),
  })
}

function onSelect(entity: CarouselEntity) {
  if (options.value.selectedItem.some(e => e.id === entity.id)) {
    options.value.selectedItem = options.value.selectedItem.filter(e => e.id !== entity.id)
  } else {
    options.value.selectedItem.push(entity)
  }
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

  if (principalStore.hasPermission('perms[resource_server_data_dictionary:save]')) {
    options.value.actionButtons.push({
      key: 'add',
      label: globalProperties.$t('common.add',{name:''}),
      icon: () => createIcon('icon-add'),
    })
  }
  if (principalStore.hasPermission('perms[resource_server_data_dictionary:delete]')) {
    options.value.actionButtons.push({
      key: 'deleteSelect',
      label: globalProperties.$t('common.delete.selected'),
      icon: () => createIcon('icon-delete'),
    })
  }

  if (tabDataSource.value.length > 0) {
    loadDataSource(tabDataSource.value.at(0) as TabDataSource);
  }

  loading.value = false
}

onMounted(mounted)
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
                    :src="attachmentService.query(entity.cover.bucketName, entity.cover.objectName)"
                    :fallback="notFound"
                  />
                </div>
              </a-carousel>

              <a-card :title="(item?.label || '') + globalProperties.$t('resourceServer.carousel.dataContent')" >
                <template #extra>
                  <l-action-button :action-items="options.actionButtons" @action-item-click="(key:string) => onActionItemClick(key, null as unknown as string)"/>
                </template>
                <a-empty v-if="(item?.cardPage?.elements || []).length <= 0"/>

                <a-card-grid
                  @click="onSelect(entity)"
                  v-else
                  :class="'w-1/5 ' + (options.selectedItem.some(e => e.id === entity.id) ? 'bg-info-bg' : '')"
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
                          <a-button
                            @click.stop="onActionItemClick('edit', entity.id)"
                            size="small"
                            type="text"
                            :disabled="!principalStore.hasPermission('perms[resource_server_data_dictionary:save]')"
                          >
                            <icon-font class="icon" type="icon-edit"></icon-font>
                          </a-button>
                          <a-button size="small" type="text" :disabled="!principalStore.hasPermission('perms[resource_server_data_dictionary:save]')">
                            ::
                          </a-button>
                          <a-button @click="onActionItemClick('delete', entity.id)" size="small" type="text" :disabled="!principalStore.hasPermission('perms[resource_server_data_dictionary:delete]')">
                            <icon-font class="icon" type="icon-delete"></icon-font>
                          </a-button>
                        </template>
                      </a-card>
                    </a-tooltip>
                  </a-badge-ribbon>
                </a-card-grid>
              </a-card>

              <a-pagination hide-on-single-page :current="item?.cardPage?.number" :pageSize="item?.cardPage?.size" :total="item?.cardPage?.totalCount" align="center"/>
            </a-space>
          </a-spin>
        </template>
      </a-tabs>

    </l-menu-title-card>
  </div>
</template>
