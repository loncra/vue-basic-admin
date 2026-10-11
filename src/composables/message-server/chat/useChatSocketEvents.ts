import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
} from '@/types/apis'
import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {SOCKET_EVENT_TYPE} from '@/constants'
import {parseSocketRestPayload} from '@/types/socket.ts'
import type {ImChatExpose} from '@loncra/antdv-chat-pro'

export function useChatSocketEvents(getChat: () => ImChatExpose | undefined) {
  const {on} = useSocketSubscriptions()

  on(SOCKET_EVENT_TYPE.CHAT_MESSAGE, (payload) => {
    const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
    if (result.data) {
      getChat()?.applyIncomingMessage(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_CREATE, (payload) => {
    const result = parseSocketRestPayload<UserChatConversationResponseBody>(payload)
    if (result.data) {
      void getChat()?.addConversation(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID, (payload) => {
    const result = parseSocketRestPayload<number>(payload)
    if (result.data) {
      void getChat()?.refreshConversationByRoom(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_CONVERSATION_REFRESH, () => {
    void getChat()?.refreshConversations()
  })
  on(SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID, (payload) => {
    const result = parseSocketRestPayload<number>(payload)
    if (result.data) {
      void getChat()?.refreshParticipants(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ, (payload) => {
    const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
    if (result.data) {
      getChat()?.applyMessageUpdate(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UPDATE, (payload) => {
    const result = parseSocketRestPayload<UserChatMessageResponseBody | UserChatMessageEntity>(payload)
    if (result.data) {
      getChat()?.applyMessageUpdate(result.data)
    }
  })
  on(SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO, (payload) => {
    const result = parseSocketRestPayload<UserChatMessageEntity>(payload)
    if (result.data) {
      getChat()?.applyMessageUndo(result.data)
    }
  })
}
