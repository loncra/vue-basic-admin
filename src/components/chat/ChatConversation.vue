<script setup lang="ts">

import {AttachmentService} from "@/apis";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject, onMounted,
  ref,
  resolveComponent,
  type VNode
} from "vue";
import type {
  ActiveConversationItem,
  ChatBubbleItem,
  PageResult,
  PlatformUser, RestResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity
} from "@/types/apis";
import type {ConversationItemType, ItemType} from "@antdv-next/x/dist/conversations/interface";
import {
  MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY,
  SOCKET_EVENT_TYPE
} from "@/constants/systemConstant.ts";
import {requireNonNullOrUndefined} from "@/utils";
import {Conversations as AxConversations,} from '@antdv-next/x'
import {useSocketStore} from "@/stores/socketStore.ts";

defineOptions({
  name: 'LChatConversation',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)

const socketStore = useSocketStore();

const conversationActive = ref<{
  key?: string,
  item: ActiveConversationItem | undefined
  loading: boolean
  sending?: boolean
  dataSource: PageResult<UserChatMessageEntity>
  bubbleList: ChatBubbleItem[]
}>({
  key: undefined,
  item: undefined,
  loading: false,
  sending: false,
  dataSource: {
    elements: [],
    first: false,
    last: false,
    number: 1,
    size: 10
  },
  bubbleList: []
})

const dataSource = defineModel<UserChatConversationResponseBody[]>('dataSource', {default:() => []})

const emit = defineEmits<{
  change: [item: ActiveConversationItem]
}>()

function onConversationsActiveChange(value: string, item: ItemType | undefined): void {
  conversationActive.value.key = value
  if (!item || !(item as ConversationItemType)) {
    conversationActive.value.item = undefined
    return;
  }
  const conversationItem = item as ConversationItemType
  conversationActive.value.item = {
    key: conversationItem.key,
    label: typeof conversationItem.label === 'string' ? conversationItem.label : String(conversationItem.label ?? ''),
    data: conversationItem.data as UserChatConversationResponseBody | PlatformUser | undefined,
  }
  const label = h('span', {}, {default: () => conversationItem.label})
  const space = resolveComponent('ASpace')
  const avatar = h(
    resolveComponent('AAvatar'),
    {src: conversationItem?.data?.avatar || ''},
    [String(conversationItem.label).substring(0, 1)]
  )

  const node: VNode = h(
    space,
    {},
    [label, avatar]
  )

  setMessageExtraContent?.(node)

  emit("change", conversationActive.value.item)

}

function getLastMessageContent(lastUserMessage: UserChatMessageEntity | undefined) {
  if (!lastUserMessage) {
    return ''
  }
  let content = ""
  for (const block of lastUserMessage.content) {
    if (block.type === 'text') {
      content += block.value || ''
    } else if (block.type === 'custom' && block.slotKind === 'files') {
      for (const file of block.files) {
        const contentType = file?.extraHeaders?.['Content-Type'] || ''
        if (contentType.startsWith('image/')) {
          content += '[图片]'
        } else if (contentType.startsWith('video/')) {
          content += '[视频]'
        } else if (contentType.startsWith('audio/')) {
          content += '[音频]'
        } else {
          content += '[文件]'
        }
      }
    }
  }
  return content
}

function onChatMessageReceived(payload: string): void {
  const result:RestResult<UserChatMessageEntity> = JSON.parse(payload)
  console.info(result)
}

function mounted() {
  socketStore.on(SOCKET_EVENT_TYPE.CHAT_MESSAGE, onChatMessageReceived)
}

onMounted(mounted)
</script>

<template>
  <a-flex flex="1" class="h-full min-h-0" >
    <ax-conversations
      :activeKey="conversationActive.key"
      :classes="{item:'p-sm! h-auto! rounded-none!'}"
      :items="(dataSource || []).map(r => ({label:r.room.name, key:String(r.id), data:r}))"
      :onActiveChange="onConversationsActiveChange"
      v-if="dataSource.length > 0"
      class="w-full p-0! gap-0!">
      <template #iconRender="{ item }">
        <a-avatar
          :src="item?.data?.avatar ? AttachmentService.query(item?.data?.avatar.bucketName, item?.data?.avatar.objectName) : undefined"
          size="large"
        >
          {{ item.label.substring(0, 1) }}
        </a-avatar>
      </template>
      <template #labelRender="{item}">
        <a-flex vertical>
          <a-flex gap="small">
            <a-typography-text ellipsis class="flex-1">
              {{ item?.label }}
            </a-typography-text>
            <a-typography-text type="secondary" v-if="item?.data?.lastUserMessage">
              {{
                globalProperties.$dayjs(item?.data?.lastUserMessage.creationTime).fromNow()
              }}
            </a-typography-text>
          </a-flex>
          <a-typography-text ellipsis v-if="item?.data?.draft" type="danger">
            [草稿]:{{ item?.data?.draft }}
          </a-typography-text>
          <a-typography-text ellipsis v-if="item?.data?.lastUserMessage" type="secondary">
            {{ getLastMessageContent(item?.data?.lastUserMessage) }}
          </a-typography-text>
        </a-flex>
      </template>
    </ax-conversations>
    <a-flex v-else justify="center" align="center" class="size-full">
      <a-empty/>
    </a-flex>
  </a-flex>
</template>
