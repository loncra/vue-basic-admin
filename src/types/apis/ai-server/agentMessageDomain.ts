import type {AbstractXRequestClass, SSEOutput} from '@antdv-next/x-sdk'
import type {AgentMessageEntity as ClientAgentMessageEntity} from '@loncra/client/ai'
import type {BaseChatBubble, ChatContentBlock} from '@/types/composables'

export interface AgentMessageEntity
  extends Omit<ClientAgentMessageEntity, 'content'>, BaseChatBubble {
  content: ChatContentBlock[]
}

export interface StreamAgentMessageEntity extends AgentMessageEntity {
  stream?: AbstractXRequestClass<Record<string, never>, SSEOutput>
  copy?: boolean
  reedit?: boolean
}
