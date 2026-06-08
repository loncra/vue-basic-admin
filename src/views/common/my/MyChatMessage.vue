<script setup lang="ts">
import {BubbleList as AxBubbleList, Conversations as AxConversations,} from '@antdv-next/x'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onMounted,
  ref,
  resolveComponent,
  type VNode
} from "vue";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";
import type {ConversationItemType, ItemType} from "@antdv-next/x/dist/conversations/interface";
import ChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from "@/constants/systemConstant";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {
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

const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)
defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const segmented = ref<{
  value:string
  data:Record<string, unknown>[]
}>({
  value:'conversation',
  data:[{
    value:'conversation',
    iconText:'loncra-message-square-more'
  },{
    value:'contact',
    iconText:'loncra-contact'
  }]
})

const options = ref<{
  conversationDataSource:UserChatConversationResponseBody[]
  contactDataSource:ConversationItemType[]
  loading:boolean
}>({
  conversationDataSource:[],
  contactDataSource:[],
  loading:false
})

const conversationActive = ref<{
  key?:string,
  item:ConversationItemType | undefined
  loading:boolean
  sending?:boolean
  dataSource:PageResult<UserChatMessageEntity>
  bubbleList:ChatBubbleItem[]
}>({
  key:undefined,
  item:undefined,
  loading:false,
  sending:false,
  dataSource:{
    elements: [],
    first: false,
    last: false,
    number: 1,
    size: 10
  },
  bubbleList:[]
})

const userChatMessageService = new UserChatMessageService()

async function loadConversationData(chatRoomId: string) {
  conversationActive.value.loading = true
  try {
    const result = await userChatMessageService.page({number:1, chatRoomId}) as RestResult<PageResult<UserChatMessageEntity>>
    if (!result.data) {
      return ;
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
  }finally {
    conversationActive.value.loading = false
  }
}

function getConversationItemAvatar(item:BubbleItemType) {
  return item?.extraInfo ? AttachmentService.query(item?.extraInfo?.avatar.bucketName, item?.extraInfo?.avatar.objectName) : ''
}

function renderBubbleContent(content: ChatContentBlock[]) {
  return h(ChatMessageBubbleContent, {content: content})
}

const bubbleListRole = {
  user: {contentRender: renderBubbleContent,variant:'filled', placement:'end', shape:'corner', classes:{content:'bg-primary-bg!'}},
  ai: {contentRender: renderBubbleContent, variant:'filled', placement:'start', shape:'corner',},
}

async function onSendMessage(content: ChatContentBlock[]) {
  const conversationItem = conversationActive.value.item as ConversationItemType | undefined
  const body = conversationItem?.data as UserChatConversationResponseBody | undefined
  const chatRoomId = body?.room?.id
  if (!chatRoomId || !conversationItem) {
    return
  }
  conversationActive.value.sending = true
  try {
    await ChatMessageService.send(content, String(chatRoomId))
    await loadConversationData(String(conversationItem.key))
  } finally {
    conversationActive.value.sending = false
  }
}

async function onContactActiveChange(value: string, item: ItemType | undefined) {
  if (!item || !(item as ConversationItemType)) {
    return ;
  }
  const conversationItem = (item as ConversationItemType)
  const name = conversationItem.label
  options.value.loading = true
  try {
    const result:RestResult<UserChatConversationResponseBody> = await ChatMessageService.createConversation(
      {
        id: undefined,
        version: undefined,
        name:String(name)
      },
      [conversationItem?.data?.systemName]
    )
    if (!result.data) {
      return ;
    }
    const body:UserChatConversationResponseBody = result.data;
    let find = options.value.conversationDataSource.find(d => d.id === body.id)
    if (find) {
      options.value.conversationDataSource = options.value.conversationDataSource.filter(d => d.id !== body.id)
    } else {
      find = body
    }
    options.value.conversationDataSource = [
      find,
      ...options.value.conversationDataSource,
    ]
    segmented.value.value = 'conversation'
    await nextTick()
    onConversationsActiveChange(String(find.id), {label:find.room.name, key:String(find.id), data:find})
  } finally {
    options.value.loading = false
  }

}

function onConversationsActiveChange(value: string, item: ItemType | undefined): void {
  conversationActive.value.key = value
  if (!item || !(item as ConversationItemType)) {
    conversationActive.value.item = undefined
    return ;
  }
  const conversationItem = item as ConversationItemType
  conversationActive.value.item = conversationItem
  loadConversationData(String(conversationItem.key))
  const label = h('span', {}, {default:() => conversationItem.label})
  const space = resolveComponent('ASpace')
  const avatar = h(
    resolveComponent('AAvatar'),
    {src:conversationItem?.data?.avatar || ''},
    [String(conversationItem.label).substring(0,1)]
  )

  const node:VNode =  h(
    space,
    {},
    [label, avatar]
  )

  setMessageExtraContent?.(node)
}

async function mounted() {
  options.value.loading = true
  try {
    const chatRoomResult:RestResult<UserChatConversationResponseBody[]> = await ChatMessageService.my({number:1})
    if (chatRoomResult.data) {
      options.value.conversationDataSource = chatRoomResult.data
    }
    const contactResult:RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers({number:-1})
    if (contactResult.data) {
      const list: ConversationItemType[] = []
      for (const r of contactResult.data) {
        for (const v of r.value) {
          list.push({
            key: String(v.id),
            label: v.realName || v.username,
            group: r.name,
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
              <a-input-search />
            </div>
            <a-flex flex="1" class="h-full min-h-0" v-if="segmented.value === 'conversation'">
              <ax-conversations
                :activeKey="conversationActive.key"
                :classes="{item:'p-sm! h-auto! rounded-none!'}"
                :items="(options.conversationDataSource || []).map(r => ({label:r.room.name, key:String(r.id), data:r}))"
                :onActiveChange="onConversationsActiveChange"
                v-if="options.conversationDataSource.length > 0"
                class="w-full p-0! gap-0!">
                <template #iconRender="{ item }" >
                  <a-avatar
                    :src="item?.data?.avatar ? AttachmentService.query(item?.data?.avatar.bucketName, item?.data?.avatar.objectName) : undefined"
                    size="large"
                  >
                    {{item.label.substring(0,1)}}
                  </a-avatar>
                </template>
                <template #labelRender="{item}">
                  <a-flex vertical>
                    <a-flex gap="small">
                      <a-typography-text ellipsis class="flex-1">
                        {{item?.label}}
                      </a-typography-text>
                      <a-typography-text type="secondary" v-if="item?.data?.lastMessage">
                        {{ globalProperties.$dayjs(item?.data?.lastMessage.creationTime).fromNow() }}
                      </a-typography-text>
                    </a-flex>
                    <a-typography-text ellipsis v-if="item?.data?.draft" type="danger">
                      [草稿]:{{item?.data?.draft}}
                    </a-typography-text>
                    <a-typography-text ellipsis v-if="item?.data?.lastMessage" type="secondary">
                      {{item?.data?.lastMessage}}
                    </a-typography-text>
                  </a-flex>
                </template>
              </ax-conversations >
              <a-flex v-else justify="center" align="center" class="size-full">
                <a-empty />
              </a-flex>
            </a-flex>
            <a-flex flex="1" class="h-full min-h-0" v-else-if="segmented.value === 'contact'">
              <ax-conversations
                :classes="{item:'p-xs! h-auto! rounded-none!'}"
                :items="(options.contactDataSource || [])"
                :onActiveChange="onContactActiveChange"
                v-if="options.contactDataSource.length > 0"
                groupable
                class="w-full p-0! gap-0!">
                <template #iconRender="{ item }" >
                  <a-avatar
                    :src="item?.data?.avatar ? AttachmentService.query(item?.data?.avatar.bucketName, item?.data?.avatar.objectName) : undefined"
                    size="large"
                  >
                    {{item.label.substring(0,1)}}
                  </a-avatar>
                </template>
                <template #labelRender="{item}">
                  <a-flex vertical>
                    <a-typography-text ellipsis class="flex-1">
                      {{item?.label}}
                    </a-typography-text>
                    <a-typography-text ellipsis type="secondary">
                      {{item?.data?.phoneNumber || item?.data?.email || ' '}}
                    </a-typography-text>
                  </a-flex>
                </template>
              </ax-conversations >
              <a-flex v-else justify="center" align="center" class="size-full">
                <a-empty />
              </a-flex>
            </a-flex>

            <div class="shrink-0 p-xs bg-layout -ml-1px">
              <a-segmented v-model:value="segmented.value" block :options="segmented.data" @change="(key:string )=> segmented.value = key ">
                <template #iconRender="{ iconText }">
                  <icon-font class="icon align" :type="iconText" />
                </template>
              </a-segmented>
            </div>
          </a-flex>
        </a-spin>
      </a-splitter-panel>
      <a-splitter-panel class="size-full min-h-0 overflow-hidden">
        <a-flex
          vertical
          v-if="conversationActive.key"
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
            <l-chat-message-sender @submit="onSendMessage" />
          </div>
        </a-flex>
        <a-flex v-else vertical class="size-full" justify="center" align="center" >
          <a-empty />
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>
</template>
