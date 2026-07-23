import type {AgentConversationEntity, ObjectWriteResult, PageResult} from '@/types/apis'
import type {
  ActiveChatSession,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables/chat.ts'
import type {Ref} from 'vue'
import {AGENT_CHAT_STATUS} from '@/constants'
import type {AgentMessageLoaderApi} from '@/composables/ai-server/agent/useAgentMessageLoader.ts'

export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean
}

export interface ActiveAgentConversationItem
  extends AgentConversationItem, ActiveChatSession {}

export interface AgentChatContext {
  conversationActive: Ref<ActiveAgentConversationItem | undefined>
  conversations: Ref<AgentConversationItem[]>
  activateConversation: (
    conversation: AgentConversationItem | undefined,
    messageId?: number,
  ) => void
  loader: AgentMessageLoaderApi
}

export type AgentChatStatus = (typeof AGENT_CHAT_STATUS)[keyof typeof AGENT_CHAT_STATUS]

export interface ProvideAgentChatContextOptions {
  view: Ref<AgentViewController | undefined>
}

export interface AgentViewController {
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
  getScrollBox(): HTMLElement | undefined
}

export interface AgentSenderFormProps {
  /** 模型设置 id */
  modelId?: number
  /** 应答类型:10.ask,20.plan,30.agent */
  type?: number
  /** 消息词槽格式内容 */
  content: ChatContentBlock[]
  /** 附件媒体内容 */
  attachment?: ObjectWriteResult[]
  /** 附加元数据内容 */
  metadata?: Record<string, unknown>
}

export interface AgentChatRequestBody extends AgentSenderFormProps {
  /** 会话 id */
  agentConversationId?: number
}

export interface AgentChatResponseBody {
  conversation: AgentConversationEntity
  userMessageId: number
}

export interface AgentSenderProps {
  onSubmit: (data: AgentSenderFormProps) => void
}

export type {ChatBubbleItem, PageResult}
