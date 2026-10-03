<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  type Ref,
  ref
} from "vue";
import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import type {SystemUserContactItem} from "@loncra/antdv-pro";
import {UserAvatar as LUserAvatar} from '@loncra/antdv-pro';
import type {IdNameValueMetadata, RestResult} from "@loncra/client/commons";
import {isEnumValue} from '@loncra/client/commons'
import type {PlatformUser} from "@loncra/client/auth";
import {getSendInstructionIcon, requireNonNullOrUndefined} from "@/utils";
import {AuthServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore";
import LChatConversation from "@/components/message-server/chat/ChatConversation.vue";
import LChatContact from "@/components/message-server/chat/ChatContact.vue";
import LChatView from "@/components/message-server/chat/ChatView.vue";
import type {ChatViewController, ServerConversationItem} from "@/types/composables";
import LChatRoomView from "@/components/message-server/chat/ChatRoomView.vue";
import {provideUserChatContext} from "@/composables/message-server/chat";
import {useAppNotification} from "@/composables/useAppNotification.ts";
import {CHAT_BUBBLE_TYPE} from '@/constants'
import {
  MESSAGE_SERVER_MESSAGE_GROUP,
  MESSAGE_SERVER_USER_CHAT_ROOM_TYPE
} from '@loncra/client/message'
import {ImChat} from '@loncra/antdv-chat'
import type {ImSocketHandlers} from '@loncra/chat-core'
import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {parseSocketRestPayload} from '@/types/socket.ts'
import {SOCKET_EVENT_TYPE} from '@/constants'

defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

/**
 * ── 试验挂载（**临时**，2026-10-03 Step 3-B）：`?lim=1` 时整个页面换成包内的 `l-im`。
 *
 * `port.subscribe` 已是**真实 socket 桥**（2026-10-03 3-C 收尾，见下面 `imPort`）；`getPrincipal` 也是真的。
 * Step 5 正式切换后删掉这段开关与 `v-else` 分支（桥那部分搬进宿主基础设施）。
 */
const nextMode = computed(() => globalProperties.$route.query.lim === '1')

/**
 * `port.subscribe` 的**真实接线**（2026-10-03 3-C 收尾）：事件名与载荷解析**逐条照抄**
 * `composables/message-server/chat/useChatSocketEvents.ts:115-124` 与 `ChatView.vue:265-277`
 * （再加上通话三条 ⇒ 那三条属 Step 4，先不接）。
 *
 * ⚠️ 模块的每个 handler 收的是**解开后的实体**（`RestResult.data`），不是整个 `RestResult`
 * ⇒ 这里统一 `parseSocketRestPayload(...).data` 之后再传。
 * ⚠️ "已读回执"与"消息更新"宿主接的是**同一个**处理器 ⇒ 这里也进 `onMessageUpdated`。
 */
const {on} = useSocketSubscriptions()
const imPort = {
  getPrincipal: () => principalStore.state.name,
  subscribe: (handlers: ImSocketHandlers) => {
    const disposers = [
      on(SOCKET_EVENT_TYPE.CHAT_MESSAGE, (payload) => {
        const data = parseSocketRestPayload<UserChatMessageResponseBody>(payload).data
        if (data) {
          handlers.onMessage(data)
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ, (payload) => {
        const data = parseSocketRestPayload<UserChatMessageResponseBody>(payload).data
        if (data) {
          handlers.onMessageUpdated(data)
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UPDATE, (payload) => {
        const data = parseSocketRestPayload<UserChatMessageResponseBody>(payload).data
        if (data) {
          handlers.onMessageUpdated(data)
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO, (payload) => {
        const data = parseSocketRestPayload<UserChatMessageEntity>(payload).data
        if (data) {
          handlers.onMessageUndone(data)
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE, (payload) => {
        const data = parseSocketRestPayload<UserChatConversationResponseBody>(payload).data
        if (data) {
          handlers.onConversationCreated(data)
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID, (payload) => {
        const roomId = parseSocketRestPayload<number>(payload).data
        if (roomId != null) {
          handlers.onConversationRefreshByRoomId(Number(roomId))
        }
      }),
      on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH, () => handlers.onConversationRefresh()),
    ]
    return () => disposers.forEach((dispose) => dispose())
  },
}
function onImEvent(event: unknown): void {
  // 临时：先看事件流（正式接法见 Step 5：系统通知 / 外层角标 / 页面标题都从这儿来）
  console.log('[l-im] event', event)
}

/**
 * `#senderName` 插槽用：**群聊才出表头**（单聊：AI 显示会话名、我发的不出头）—— 2026-10-03 用户拍定。
 * 模块通过插槽参数把 `conversation` 给过来（判据在宿主，模块不替宿主下结论）。
 */
function isGroupChat(conversation: UserChatConversationResponseBody | undefined): boolean {
  return isEnumValue(conversation?.room?.type, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT)
}

function nameOfParticipant(item: {data?: UserChatMessageResponseBody} | undefined): string {
  const details = item?.data?.participant?.metadata?.details
  return details
    ? AuthServerService.getPrincipalNameByUserDetails(details)
    : globalProperties.$t('common.unname')
}

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

const options = ref<{
  contactDataSource: SystemUserContactItem[]
  loading: boolean
}>({
  contactDataSource: [],
  loading: false
})

const {getNotificationKey, destroy} = useAppNotification()

const chatViewRef = ref<ChatViewController>()
const conversationRef = ref<InstanceType<typeof LChatConversation>>()

const {conversationActive, conversations, loader, activateConversation, refreshConversations} =
  provideUserChatContext({
    view: chatViewRef as Ref<ChatViewController | undefined>,
    refreshActiveHeader: (item: ServerConversationItem | undefined) =>
      conversationRef.value?.changeMessageExtraContent(item),
  })

async function onContactSelected(value: UserChatConversationResponseBody) {
  const target = conversations.upsertToTop(value)
  segmented.value.value = 'conversation'
  await activateConversation(target)
}

function onConversationDelete(body: UserChatConversationResponseBody) {
  conversations.remove(body.id)
  if (conversationActive.value.item?.data?.id === body.id) {
    activateConversation(undefined)
  }
}

async function onAddParticipant(
  _user: SystemUserContactItem[],
  restResult: RestResult<UserChatConversationResponseBody>,
) {
  if (!restResult.data) {
    return
  }
  await activateConversation(restResult.data)
}

function onHistoryClick(data: UserChatMessageResponseBody) {
  loader.jumpToHistoryMessage(data)
}

async function mounted() {
  const keys:unknown | null = getNotificationKey(MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT)
  if (keys) {
    const messageNotificationKeys = keys as Set<string>
    messageNotificationKeys.forEach(destroy)
  }
  options.value.loading = true
  try {
    await refreshConversations()
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> =
      await AuthServerService.systemUsers({number: -1}, true, false)
    if (contactResult.data) {
      const list: SystemUserContactItem[] = []
      for (const r of contactResult.data) {
        r.value.forEach((v) =>
          list.push({
            key: String(v.id),
            label: v.realName || v.username,
            group: r.name,
            disabled: principalStore.isCurrentPrincipal(v.systemName),
            data: v,
          }),
        )
      }
      options.value.contactDataSource = [...list]
    }
  } finally {
    options.value.loading = false
  }
  await nextTick()
  const find = conversations.findById(Number(globalProperties.$route.query.conversationId))
  if (find) {
    await activateConversation(find, Number(globalProperties.$route.query.messageId))
  }
}

onMounted(mounted)
</script>

<template>
  <!-- 试验挂载（临时）：`?lim=1` ⇒ 用包内的 `l-im`；Step 5 切完删这两段开关 -->
  <div
    class="h-full min-h-0"
    v-if="nextMode">
    <ImChat
      :port="imPort"
      :contacts="options.contactDataSource"
      :format-relative-time="(t: number) => globalProperties.$dayjs(t).fromNow()"
      :active-key="String(globalProperties.$route.query.conversationId ?? '')"
      :active-message-id="Number(globalProperties.$route.query.messageId) || undefined"
      @message="onImEvent"
    >
      <!--
        头像 / "谁发的" —— 模块**不碰** `PlatformUser` ⇒ 由宿主给（判据见计划 §2.2）。
        Step 5 正式接线就是这两段（逻辑照抄 `ChatBubbleList.vue:155-172` 的 #avatar / #header）。
      -->
      <template #avatar="{ item }">
        <l-user-avatar size="large" :user="item?.data?.participant?.metadata?.details"/>
      </template>
      <!--
      指令芯片：**宿主自己实现**（模块默认只渲染 `Tag` + 文案、不带图标）——
      这里就是宿主原来那套：图标按前缀走 `instructionIconMap`（`utils/chatUtils.ts`），
      再用 icon-font 渲染；外层 `a-tag variant="outlined"` 与宿主 `instructionCustomRender` 一致。
    -->
    <template #instructionChip="{ slot }">
      <a-tag variant="outlined">
        <template #icon v-if="getSendInstructionIcon(slot.prefix, false)">
          <icon-font :type="getSendInstructionIcon(slot.prefix, false) as string" />
        </template>
        {{ slot.value.value }}
      </a-tag>
    </template>
    <template #senderName="{ item, conversation }">
        <!--
          **表头只有群聊才有**（2026-10-03 用户拍定）：AI ⇒ 参与者名字；我发的 ⇒ "我"。
          单聊**整块不出**（对方是谁就在页面标题/会话列表里，气泡上不必重复）。
        -->
        <template v-if="isGroupChat(conversation)">
          <a-typography-text v-if="item?.role === CHAT_BUBBLE_TYPE.AI">
            {{ nameOfParticipant(item) }}
          </a-typography-text>
          <a-typography-text v-else type="secondary">
            {{ globalProperties.$t('common.me') }}
          </a-typography-text>
        </template>
      </template>
    </ImChat>
  </div>

  <div v-else class="h-full min-h-0">
    <a-splitter class="h-full min-h-0">
      <a-splitter-panel class="h-full p-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
        <a-spin :spinning="options.loading" class="size-full-spin">
          <a-flex vertical class="size-full min-h-0">
            <l-chat-conversation
              ref="conversationRef"
              @delete="onConversationDelete"
              v-if="segmented.value === 'conversation'"
            />
            <l-chat-contact
              @selected="onContactSelected"
              v-model:loading="options.loading"
              v-else-if="segmented.value === 'contact'"
              v-model:data-source="options.contactDataSource"
            />
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
      <a-splitter-panel class="h-full min-h-0 overflow-hidden">
        <div class="h-full min-h-0 overflow-hidden relative" v-if="conversationActive.item">
          <a-spin :spinning="conversationActive.loading" class="size-full-spin">
            <l-chat-view ref="chatViewRef">
              <template #bubbleListAfter>
                <a-button
                  @click="loader.toReadableAnchor()"
                  v-if="loader.showReadableAnchorButton()"
                  class="shadow-card absolute top-2 mt-sm left-1/2 -translate-x-1/2 animate-bounce"
                >
                  <template #icon>
                    <icon-font type="loncra-hard-drive-upload"/>
                  </template>
                  <span>{{globalProperties.$t('chat.view.readable.jumpTo')}}</span>
                </a-button>
              </template>
            </l-chat-view>
          </a-spin>
          <a-drawer
            v-if="conversationActive.item.data"
            v-model:open="conversationActive.drawerOpen"
            placement="right"
            :get-container="false"
            :closable="false"
            :mask="false"
            @close="conversationActive.drawerOpen = false"
          >
            <l-chat-room-view
              @delete-conversation="onConversationDelete"
              @add-participant="onAddParticipant"
              @history-click="onHistoryClick"
              :contact-data-source="options.contactDataSource" />
          </a-drawer>
        </div>
        <a-flex v-else vertical class="size-full" justify="center" align="center">
          <a-empty/>
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>
</template>
