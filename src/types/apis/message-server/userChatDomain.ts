import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  ParticipantMetadataMessageResponseBody as ClientParticipantMetadataMessageResponseBody,
  UserChatConversationResponseBody as ClientUserChatConversationResponseBody,
  UserChatMessageEntity as ClientUserChatMessageEntity,
  UserChatMessageResponseBody as ClientUserChatMessageResponseBody,
} from '@loncra/client/message'
import type {BaseChatBubble, ChatContentBlock} from '@/types/composables'

export interface UserChatMessageEntity
  extends Omit<ClientUserChatMessageEntity, 'content'>, BaseChatBubble {
  content: ChatContentBlock[]
}

export interface ParticipantMetadataMessageResponseBody
  extends Omit<ClientParticipantMetadataMessageResponseBody, 'content'>, UserChatMessageEntity {}

export interface UserChatMessageResponseBody
  extends Omit<ClientUserChatMessageResponseBody, 'content'>, UserChatMessageEntity {}

export interface UserChatConversationResponseBody
  extends Omit<ClientUserChatConversationResponseBody, 'draft' | 'lastUserMessage'> {
  lastUserMessage: UserChatMessageEntity
  draft?: SlotConfigType[]
}
