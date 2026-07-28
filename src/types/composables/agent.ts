import type {
  AgentConversationEntity,
  NameValueEnumMetadata,
  ObjectWriteResult,
  PageResult
} from '@/types/apis'
import type {
  ActiveChatSession,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables/chat.ts'
import type {Ref} from 'vue'
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE} from '@/constants'
import type {AgentMessageLoaderApi} from '@/composables/ai-server/agent/useAgentMessageLoader.ts'

export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean
}

export interface ActiveAgentConversationItem
  extends AgentConversationItem, ActiveChatSession {}

export type AgentStreamApi = {
  connect: (assistantId: number) => void
  disconnect: (assistantId:number) => void
  reconnectIfRunning: () => void
  disconnectIfRunning: () => void
}

export interface AgentChatContext {
  conversationActive: Ref<ActiveAgentConversationItem | undefined>
  conversations: Ref<AgentConversationItem[]>
  menuOptions:Ref<{
    openKeys:string[]
    selectedKeys:string[]
  }>
  activateConversation: (
    conversation: AgentConversationItem,
    messageId?: number,
  ) => void | Promise<ActiveAgentConversationItem | undefined>
  loader: AgentMessageLoaderApi
  stream: AgentStreamApi
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
  assistantId: number
}

export interface AgentSenderProps {
  onSubmit: (data: AgentSenderFormProps) => void
}

export type {ChatBubbleItem, PageResult}

export interface AgentSseMessageContent {
  sseEventId: string
  id: string
  type: typeof AGENT_CONTENT_TYPE.THINK
    | typeof AGENT_CONTENT_TYPE.ANSWER
    | typeof AGENT_CONTENT_TYPE.ERROR
    | typeof AGENT_CONTENT_TYPE.TOOL
    | typeof AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
    | typeof AGENT_CONTENT_TYPE.TOKEN_USAGE
    | typeof AGENT_CONTENT_TYPE.STREAM_END
    | typeof AGENT_CONTENT_TYPE.STREAM_START
    | typeof AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
}

export interface AgentBlockRunningMessageContent extends AgentSseMessageContent{
  status:NameValueEnumMetadata<string> | string
  creationTime:number,
  endTime?:number
}

export interface CustomizeContentMetadata extends AgentSseMessageContent {
  metadata?: Record<string, unknown>
}

export interface AgentTextMessageContent extends AgentBlockRunningMessageContent{
  value?: string
}

export interface AgentThinkBlock extends AgentTextMessageContent {
  type: typeof AGENT_CONTENT_TYPE.THINK
}

export interface AgentAnswerBlock extends AgentTextMessageContent {
  type: typeof AGENT_CONTENT_TYPE.ANSWER
}

export interface AgentErrorBlock extends CustomizeContentMetadata {
  type: typeof AGENT_CONTENT_TYPE.ERROR
  metadata:{
    message:string
  }
}

export interface GenerateConversationName extends CustomizeContentMetadata {
  type: typeof AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
  metadata:{
    name:string
  }
}

export interface AgentStatusChangeSse extends AgentSseMessageContent {
  status:NameValueEnumMetadata<number> | number
  type: typeof AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
}

export interface AgentTokenUsageContentMetadata extends AgentSseMessageContent {
  inputTokens:number
  outputTokens:number
  cachedTokens:number
  usageType:NameValueEnumMetadata<string> | string
  type: typeof AGENT_CONTENT_TYPE.TOKEN_USAGE
}

export interface AgentToolBlock extends AgentBlockRunningMessageContent {
  type: typeof AGENT_CONTENT_TYPE.TOOL
  name: string
  input?: unknown
  output?: unknown
  resultState:string
}
