import type {Ref} from 'vue'
import type {
  RestResult,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
} from '@/types/apis'
import type {ConversationActiveProps, ServerConversationItem} from '@/types/composables'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import type {ChatConversationsApi} from '@/composables/chat/useChatConversations.ts'
import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {useMessageServerStore} from '@/stores/messageServerStore.ts'
import {addBubbleListMessage, getEnumValue} from '@/utils'
import {CHAT_BUBBLE_TYPE, SOCKET_EVENT_TYPE} from '@/constants/messageConstant.ts'
import {parseSocketRestPayload} from '@/types/socket.ts'

export interface ChatSocketEventsOptions {
  conversationActive: Ref<ConversationActiveProps>
  conversations: ChatConversationsApi
  /** 当前是否已挂载会话视图（决定收到消息时是否合入气泡列表） */
  hasView: () => boolean
  /** 刷新活跃会话头部额外内容（ChatConversation.changeMessageExtraContent） */
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
  /** 重新激活某会话（MyChatMessage.setActiveConversationItemByEntity） */
  activateConversation: (
    body: UserChatConversationResponseBody | undefined,
  ) => Promise<void> | void
}

/**
 * 集中 chat 模块的 socket 事件接线（新消息 / 新建会话 / 按房间刷新 / 全量刷新）。
 * 基于 useSocketSubscriptions 自动清理，数据层变更委托 useChatConversations，
 * UI 编排（头部刷新 / 重新激活）通过回调注入。
 */
export function useChatSocketEvents(options: ChatSocketEventsOptions) {
  const {conversationActive, conversations, hasView, refreshActiveHeader, activateConversation} =
    options
  const principalStore = usePrincipalStore()
  const messageServerStore = useMessageServerStore()
  const {on} = useSocketSubscriptions()

  async function onChatMessageReceived(
    result: RestResult<UserChatMessageResponseBody | UserChatMessageEntity>,
  ): Promise<void> {
    if (!result.data || result.data.principal === principalStore.state.name) {
      return
    }
    const active = conversationActive.value
    if (active.item?.data?.room?.id === result.data.chatRoomId && hasView()) {
      const role =
        getEnumValue(result.data.type) === 20 ? CHAT_BUBBLE_TYPE.SYSTEM : CHAT_BUBBLE_TYPE.AI
      addBubbleListMessage(result.data, role, active.bubbleList, false, !active.isOnFirstPage)
    }
    conversations.moveToTopByRoomId(result.data.chatRoomId, (c) => {
      c.lastUserMessage = result.data as UserChatMessageEntity
    })
  }

  function onChatConversationReceived(
    result: RestResult<UserChatConversationResponseBody>,
  ): void {
    if (!result.data) {
      return
    }
    messageServerStore.fetchUnreadQuantity()
    conversations.unshiftIfAbsent(result.data)
  }

  async function onConversationRefreshByRoomId(result: RestResult<number>): Promise<void> {
    if (!result.data) {
      return
    }
    if (!conversations.findByRoomId(result.data)) {
      return
    }
    const conversationResult: RestResult<
      UserChatConversationEntity | UserChatConversationResponseBody
    > = await ChatMessageService.getConversation(result.data, true)
    if (!conversationResult.data) {
      return
    }
    const find = conversations.replaceByRoomId(
      result.data,
      conversationResult.data as UserChatConversationResponseBody,
    )
    if (!find) {
      return
    }
    const active = conversationActive.value
    if (!active.item || !active.item?.data) {
      return
    }
    if (active.item?.data?.room?.id === result.data) {
      active.item = {
        label: find.name,
        key: String(find.id),
        data: find,
      }
      refreshActiveHeader(active.item)
    }
  }

  async function onConversationRefresh(): Promise<void> {
    const chatRoomResult: RestResult<UserChatConversationResponseBody[]> =
      await ChatMessageService.my()
    if (chatRoomResult.data) {
      conversations.setAll(chatRoomResult.data)
    }
    const active = conversationActive.value
    if (!active.item) {
      return
    }
    const find = conversations.findById(active.item?.data?.id)
    await activateConversation(find)
  }

  on(SOCKET_EVENT_TYPE.CHAT_MESSAGE, (payload) =>
    onChatMessageReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload)),
  )
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE, (payload) =>
    onChatConversationReceived(parseSocketRestPayload<UserChatConversationResponseBody>(payload)),
  )
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID, (payload) =>
    onConversationRefreshByRoomId(parseSocketRestPayload<number>(payload)),
  )
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH, () => onConversationRefresh())

  return {onConversationRefresh}
}

export type ChatSocketEventsApi = ReturnType<typeof useChatSocketEvents>
