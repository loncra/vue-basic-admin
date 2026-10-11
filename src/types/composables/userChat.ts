import type {MaybeRef, Ref} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from '@/types/apis'
import type {TimeProperties} from '@loncra/client/commons'
import type {UserChatParticipantEntity} from '@loncra/client/message'
import type {ImConversationsApi} from '@loncra/antdv-chat-pro'
import type {ChatMessageLoaderApi} from '@/composables/message-server/chat/useChatMessageLoader.ts'
import type {
  ActiveChatSession,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables/chat.ts'

export interface ServerConversationItem {
  key: string
  label: string
  data?: UserChatConversationResponseBody
}

export interface UserChatConversationActiveProps extends ActiveChatSession {
  item: ServerConversationItem | undefined
  drawerOpen: boolean
  sending?: boolean
  readableAnchorLoading?: boolean
  participants: UserChatParticipantEntity[]
}

export interface ChatViewController {
  jumpToMessage(
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ): void
  scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void
  getSenderSlotConfigValue(): SlotConfigType[]
  persistSenderDraft(): Promise<void>
}

export interface ProvideUserChatContextOptions {
  view: Ref<ChatViewController | undefined>
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
}

export interface UserChatContext {
  conversationActive: Ref<UserChatConversationActiveProps>
  conversations: ImConversationsApi<UserChatConversationResponseBody>
  loader: ChatMessageLoaderApi
  activateConversation: (
    body: UserChatConversationResponseBody | undefined,
    messageId?: number,
  ) => Promise<void>
  refreshConversations: () => Promise<void>
}

export interface ChatBubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReedit: (content: ChatContentBlock[]) => void
  onReferenceMessage: (message: UserChatMessageResponseBody) => void
  onReloadLastPage: () => void
}

export interface UseChatCallModalParams {
  closeTimerValue: Ref<TimeProperties>
}

export interface UseChatMessageSenderParams {
  refMessages: Ref<UserChatMessageResponseBody[]>
  sending: MaybeRef<boolean>
  getUploadOptions: () => Record<string, unknown> | undefined
  onSubmit: (content: ChatContentBlock[]) => void
  getSender: () => SenderRef | undefined
}

export interface ChatSocketEventsOptions {
  conversationActive: Ref<UserChatConversationActiveProps>
  conversations: ImConversationsApi<UserChatConversationResponseBody>
  hasView: () => boolean
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
  activateConversation: (
    body: UserChatConversationResponseBody | undefined,
  ) => Promise<void> | void
  loadParticipant: (roomId: number) => Promise<void>
}

export interface UseChatNotificationParam {
  chatCallConfig: UseChatCallModalParams
}

export type {ChatBubbleItem}
