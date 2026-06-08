<script setup lang="ts">
import {BubbleList as AxBubbleList,} from '@antdv-next/x'
import {type ComponentInternalInstance, getCurrentInstance, h, nextTick, onMounted, ref} from "vue";
import type {BubbleItemType, RoleType} from "@antdv-next/x/dist/bubble/interface";
import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import ChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {
  type ActiveConversationItem,
  type ChatBubbleItem,
  type IdNameValueMetadata,
  type PageResult,
  type PlatformUser,
  type RestResult,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity
} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import {AttachmentService, AuthServerService} from "@/apis";
import {UserChatMessageService} from "@/apis/message-server/chat/userChatMessageService.ts";
import {usePrincipalStore} from "@/stores/principalStore";
import LChatMessageSender from "@/components/chat/ChatMessageSender.vue";
import type {ChatContentBlock} from "@/types/composables";
import LChatConversation from "@/components/chat/ChatConversation.vue";
import LChatContact from "@/components/chat/ChatContact.vue";

defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const segmented = ref<{
  value: string
  data: Record<string, unknown>[]
}>({
  value: 'conversation',
  data: [{
    value: 'conversation',
    iconText: 'loncra-message-square-more'
  }, {
    value: 'contact',
    iconText: 'loncra-contact'
  }]
})

const senderRef = ref<InstanceType<typeof LChatMessageSender>>()

const options = ref<{
  conversationDataSource: UserChatConversationResponseBody[]
  contactDataSource: ActiveConversationItem[]
  loading: boolean
}>({
  conversationDataSource: [],
  contactDataSource: [],
  loading: false
})

const conversationActive = ref<{
  item: ActiveConversationItem | undefined
  loading: boolean
  sending?: boolean
  dataSource: PageResult<UserChatMessageEntity>
  bubbleList: ChatBubbleItem[]
}>({
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

const userChatMessageService = new UserChatMessageService()

async function loadConversationData(chatRoomId: string) {
  conversationActive.value.loading = true
  try {
    const result = await userChatMessageService.page({
      number: 1,
      chatRoomId
    }) as RestResult<PageResult<UserChatMessageEntity>>
    if (!result.data) {
      return;
    }
    conversationActive.value.dataSource = result.data
    const bubbleItems: ChatBubbleItem[] = []
    for (const d of conversationActive.value.dataSource.elements || []) {
      bubbleItems.push({
        key: String(d.id),
        role: principalStore.state.name === d.principal ? 'user' : 'ai',
        content: d.content,
      })
    }
    conversationActive.value.bubbleList = bubbleItems
  } finally {
    conversationActive.value.loading = false
  }
}

function getConversationItemAvatar(item: BubbleItemType) {
  return item?.extraInfo ? AttachmentService.query(item?.extraInfo?.avatar.bucketName, item?.extraInfo?.avatar.objectName) : ''
}

function renderBubbleContent(content: ChatContentBlock[]) {
  return h(ChatMessageBubbleContent, {content: content})
}

const bubbleListRole = {
  user: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: 'bg-primary-bg!'},
  },
  ai: {
    contentRender: renderBubbleContent,
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
  },
} satisfies RoleType

async function onSendMessage(content: ChatContentBlock[]) {
  const conversationItem = conversationActive.value.item as ConversationItemType | undefined
  const body = conversationItem?.data as UserChatConversationResponseBody | undefined
  const chatRoomId = body?.room?.id
  if (!chatRoomId || !conversationItem) {
    return
  }
  conversationActive.value.sending = true
  try {
    const result = await ChatMessageService.send(content, String(chatRoomId))
    if (!result.data) {
      return
    }
    const body: UserChatMessageEntity = result.data
    const find = options.value.conversationDataSource.find(d => d.room.id === body.chatRoomId)
    if (find) {
      options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.room.id !== body.chatRoomId)
      find.lastUserMessage = body
      options.value.conversationDataSource = [
        find,
        ...options.value.conversationDataSource,
      ]
      options.value.conversationDataSource.sort((a, b) => {
        return globalProperties.$dayjs(b.lastUserMessage?.creationTime).diff(globalProperties.$dayjs(a.lastUserMessage?.creationTime))
      })
    }
    conversationActive.value.bubbleList.push({
      key: String(body.id),
      role: 'user',
      content: body.content,
    })
    senderRef.value?.clear()
  } finally {
    conversationActive.value.sending = false
  }
}

async function onContactSelected(value: UserChatConversationResponseBody) {
  let find = options.value.conversationDataSource.find(d => d.id === value.id)
  if (find) {
    options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.id !== value.id)
  } else {
    find = value
  }
  options.value.conversationDataSource = [
    find,
    ...options.value.conversationDataSource,
  ]
  segmented.value.value = 'conversation'
  await nextTick()
  onConversationsChange({
    label: find.room.name,
    key: String(find.id),
    data: find
  })
}

function onConversationsChange(conversationItem:ActiveConversationItem): void {
  conversationActive.value.item = conversationItem
  loadConversationData(conversationItem.key)
}

async function mounted() {
  options.value.loading = true
  try {
    const chatRoomResult: RestResult<UserChatConversationResponseBody[]> = await ChatMessageService.my({number: 1})
    if (chatRoomResult.data) {
      options.value.conversationDataSource = chatRoomResult.data
    }
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers({number: -1})
    if (contactResult.data) {
      const list: ActiveConversationItem[] = []
      for (const r of contactResult.data) {
        for (const v of r.value) {
          list.push({
            key: String(v.id),
            label: v.realName || v.username,
            group: r.name,
            disabled: principalStore.state.name === v.systemName,
            data: v,
          })
        }
      }
      options.value.contactDataSource.push(...list)
    }
  } finally {
    options.value.loading = false
  }
}

onMounted(mounted)
</script>

<template>
  <div class="size-full">
    <a-splitter class="h-full min-h-0">
      <a-splitter-panel class="h-ful p-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
        <a-spin :spinning="options.loading" class="h-full-spin">
          <a-flex vertical class="size-full min-h-0">
            <div class="shrink-0 p-sm border-b border-b-border-secondary">
              <a-input-search/>
            </div>

            <l-chat-conversation @change="onConversationsChange" v-model:data-source="options.conversationDataSource" v-if="segmented.value === 'conversation'"/>

            <l-chat-contact @selected="onContactSelected" v-model:loading="options.loading" v-else-if="segmented.value === 'contact'" v-model:data-source="options.contactDataSource" />

            <div class="shrink-0 p-xs bg-layout -ml-1px">
              <a-segmented v-model:value="segmented.value" block :options="segmented.data"
                           @change="(key:string )=> segmented.value = key ">
                <template #iconRender="{ iconText }">
                  <icon-font class="icon align" :type="iconText"/>
                </template>
              </a-segmented>
            </div>
          </a-flex>
        </a-spin>
      </a-splitter-panel>
      <a-splitter-panel class="size-full min-h-0 overflow-hidden">
        <a-flex
          vertical
          v-if="conversationActive.item"
          class="h-full min-h-0 overflow-hidden"
        >
          <a-flex flex="1" vertical>
            <a-spin :spinning="conversationActive.loading" class="h-full-spin">
              <ax-bubble-list
                auto-scroll
                class="min-h-0 h-full"
                :items="(conversationActive.bubbleList as BubbleItemType[])"
                :role="bubbleListRole"
              >
                <template #avatar="{ item }">
                  <a-avatar
                    :src="getConversationItemAvatar(item)"
                    v-if="item.role === 'ai'"
                    size="large"
                  >
                    他
                  </a-avatar>
                  <a-avatar
                    :src="principalStore.getAvatarUrl()"
                    v-else
                    size="large"
                  >
                    我
                  </a-avatar>
                </template>
                <template #header="{ item }">
                  <a-typography-text v-if="item.role === 'ai'">
                    他
                  </a-typography-text>
                  <a-typography-text type="secondary" v-else>
                    我
                  </a-typography-text>
                </template>
              </ax-bubble-list>
            </a-spin>
          </a-flex>
          <div class="shrink-0 p-sm border-t border-t-border-secondary">
            <!--            <chat-message-composer @submit="onSendMessage" />-->
            <l-chat-message-sender :sending="conversationActive.sending" ref="senderRef"
                                   @submit="onSendMessage"/>
          </div>
        </a-flex>
        <a-flex v-else vertical class="size-full" justify="center" align="center">
          <a-empty/>
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>
</template>
