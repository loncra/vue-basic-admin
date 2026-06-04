<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onMounted,
  ref,
  type VNode
} from "vue";
import {MessageServerService, SiteMessageService} from "@/apis/message-server";
import type {
  IdNameMetadata,
  MySiteMessageProps,
  RestResult,
  SiteMessageEntity,
  TotalPage
} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.js";
import {createIcon, dateTimeFormat, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import useApp from "antdv-next/dist/app/useApp";
import LActionButton from "@/components/basic/ActionButton.vue";
import type {ResolvedAction} from "@/types/composables";
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from "@/constants/systemConstant.ts";

defineOptions({
  name: 'MySiteMessageHome',
})

const {message, modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const setMessageExtraContent =  inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)

const types = ref<IdNameMetadata[]>([])
const activeTagKey = ref<string>()
const siteMessages = ref<MySiteMessageProps[]>([])
const messageServerStore = useMessageServerStore()
const siteMessageService = new SiteMessageService()

const typeIcons:IdNameMetadata[] = [{
  id:"30",
  name:'loncra-message-square-dot'
},{
  id:"20",
  name:'loncra-message-square-more'
},{
  id:"10",
  name:'loncra-message-square-warning'
}]

const actions = computed<ResolvedAction[]>(() => {
  return [
    {
      id: 'deleteRead',
      label: globalProperties.$t('messageServer.site.deleteRead'),
      icon: createIcon('loncra-archive-x', 'align'),
      danger:true,
      disabled: false,
      run:onDeleteRead
    },
    {
      id: 'readAll',
      label: globalProperties.$t('messageServer.site.readAll'),
      icon: createIcon('loncra-user-check', 'align'),
      disabled: false,
      run:onReadAll
    },
  ]
})

async function mounted() {
  const result:RestResult<IdNameMetadata[]> = await MessageServerService.types('site')
  types.value = (result.data || [])
  if (types.value.length > 0) {
    types.value.forEach(item => item.iconText = typeIcons.find(i => i.id === item.id)?.name || 'loncra-file-question-mark')
    siteMessages.value.push(...types.value.map(t => createDataSource(t.id)))
    await onTabChange(types.value.at(0)?.id || '')
  }
}

async function onTabChange(activeKey:string) {
  activeTagKey.value = activeKey
  changeMessageExtraContent(activeKey)
  await nextTick()
  await loadDataSource(activeTagKey.value)
}

function changeMessageExtraContent(activeKey:string) {

  const message = siteMessages.value.find(v => v.key === activeKey)
  if (!message) {
    return
  }
  const type = types.value.find(t => t.id === message.key)
  if (!type) {
    return
  }

  const node:VNode = h('span', {}, {default:() => type.name})
  setMessageExtraContent?.(node)
}

function createDataSource(key:string) {
  return {
    dataSource: {
      totalCount: 0,
      totalPages: 0,
      number: 1,
      first: false,
      elements: [],
      numberOfElements: 0,
      size: 10,
      last: false
    },
    key:key,
    install:false,
    loading:false,
    pageRequest:{
      size:10,
      number:1,
      'filter_[type_eq]':key
    }
  }
}

async function loadDataSource(key:string) {
  const item = getCurrentItem(key)
  if (!item) {
    return
  }
  if (item?.install === false) {
    await doLoadDataSource(item)
    item.install = true
  }
}

async function doLoadDataSource(item:MySiteMessageProps) {
  item.loading = true
  try {
    const result:RestResult<TotalPage<SiteMessageEntity>> = await siteMessageService.my(item.pageRequest)
    if (result?.data) {
      item.dataSource = result.data
    }
  } finally {
    item.loading = false
  }
}

function onDeleteMessage(id:number) {
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content: globalProperties.$t('common.delete.confirmSingle'),
    onOk: () => doRemove(id)
  })
}

async function onChangePage(page: number, pageSize: number) {
  const item = getCurrentItem(activeTagKey.value)
  if (!item) {
    return
  }
  item.pageRequest.size = pageSize
  item.pageRequest.number = page
  await doLoadDataSource(item)
}

async function doRemove(id:number) {
  const item = getCurrentItem(activeTagKey.value)
  if (!item) {
    return
  }

  try {
    item.loading = true
    const result:RestResult<void> = await siteMessageService.delete([id])
    message.success(result.message)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    item.loading = false
  }
}

function getCurrentItem(key:string="") {
  const index = siteMessages.value.findIndex(v => v.key === key)
  return siteMessages.value[index]
}

async function onDeleteRead() {
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content: globalProperties.$t('common.delete.confirmSingle'),
    onOk: () => doDeleteRead()
  })
}

async function doDeleteRead() {
  const item = getCurrentItem(activeTagKey.value)
  if (!item) {
    return
  }
  item.loading = true
  try {
    const result:RestResult<void> = await siteMessageService.deleteRead(String(activeTagKey.value))
    message.success(result.message)
    item.pageRequest.number = 1
    await doLoadDataSource(item)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    item.loading = false
  }
}

async function onReadAll() {
  const item = getCurrentItem(activeTagKey.value)
  if (!item) {
    return
  }
  item.loading = true
  try {
    const result:RestResult<void> = await siteMessageService.readAll(String(activeTagKey.value))
    message.success(result.message)
    await messageServerStore.fetchUnreadQuantity()
    item.pageRequest.number = 1
    await doLoadDataSource(item)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    item.loading = false
  }
}

async function onRead(id:number) {
  const result:RestResult<SiteMessageEntity> = await siteMessageService.read(id)
  if (!result?.data) {
    return ;
  }
  const item = getCurrentItem(activeTagKey.value)
  if (!item) {
    return ;
  }
  const index = item.dataSource.elements.findIndex(v => v.id === id)
  item.dataSource.elements[index] = result.data
  await messageServerStore.fetchUnreadQuantity()
}

onMounted(mounted)

</script>

<template>
  <a-flex class="p-md w-full" vertical gap="middle">
    <a-tabs :classes="{header:'m-0'}" :items="types.map(t => ({key:t.id, label:t.name, iconText:t.iconText}))" :active-key="activeTagKey" @change="onTabChange">
      <template #rightExtra>
        <l-action-button
          :actions="actions"
        />
      </template>
      <template #labelRender="{ item }">
        <a-space>
          <icon-font class="icon align" :type="item.iconText" />
          <span>
            {{item.label}}
          </span>
          <a-badge :count="messageServerStore.getUnreadQuantity(item.key)" size="small">
          </a-badge>
        </a-space>
      </template>
    </a-tabs>

    <a-spin :spinning="getCurrentItem(activeTagKey)?.loading">
      <a-flex vertical flex="1" class="min-w-0" :key="item.id" v-for="item of (getCurrentItem(activeTagKey)?.dataSource?.elements || [])">
        <a-flex flex="1" class="min-w-0" gap="middle" align="top">
          <a-avatar>
            <icon-font class="icon" type="loncra-file-pen-line"/>
          </a-avatar>
          <a-flex vertical flex="1" class="min-w-0">
            <a-typography-text @click="getEnumValue(item.readable) === 1 ? onRead(item.id) : undefined" :strong="getEnumValue(item.readable) === 1" ellipsis class="min-w-0 m-0 text-md cursor-pointer">
              {{ item.title }}
            </a-typography-text>

            <a-typography-text type="secondary" class="hidden md:inline shrink-0">
              {{dateTimeFormat(item.creationTime)}}
            </a-typography-text>

            <a-typography-paragraph class="m-0" type="secondary" :ellipsis="{ rows: 3 }">
              {{item.content.replace(/<[^>]*>/g, '')}}
            </a-typography-paragraph>

          </a-flex>

          <a-button size="small" danger @click="onDeleteMessage(item.id)">
            <icon-font type="loncra-archive-x" />
          </a-button>
        </a-flex>
        <a-divider class="mb-sm mt-sm"/>
      </a-flex>

      <a-pagination
        align="center"
        v-if="getCurrentItem(activeTagKey)"
        :page-size="getCurrentItem(activeTagKey)?.dataSource?.size"
        :current="getCurrentItem(activeTagKey)?.dataSource?.number"
        :total="getCurrentItem(activeTagKey)?.dataSource?.totalCount"
        @change="onChangePage"
        hide-on-single-page
      />
    </a-spin>
  </a-flex>
</template>
