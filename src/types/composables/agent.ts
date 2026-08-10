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
import type {ThoughtChainItemType} from "@antdv-next/x";

export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean
}

export interface ActiveAgentConversationItem
  extends AgentConversationItem, ActiveChatSession {
}

export type AgentStreamApi = {
  connect: (assistantId: number, loadHistory?: boolean) => void
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
  type: number
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

export interface AgentResumeRequestBody {
  assistantMessageId:number
  confirmResults:ConfirmResult[]
}

export interface ConfirmResult {
  toolCallId:string;
  confirmed:boolean;
}

/** `PUT /agent/clarify`：answers 缺省/空 = 取消 */
export interface AgentClarifyRequestBody {
  assistantMessageId: number
  toolCallId: string
  answers?: Record<string, unknown>
  summary?: string
}

export interface AgentClarifyField {
  key: string
  widget: string
  label?: string
  required?: boolean
  options?: string[]
}

export interface AgentClarifyCard {
  title?: string
  fields?: AgentClarifyField[]
  commands?: unknown
}

export interface AgentChatBasicResponseBody {
  userMessageId: number
  assistantMessageId: number
}

export interface AgentChatResponseBody extends AgentChatBasicResponseBody {
  conversation: AgentConversationEntity
}

export interface AgentSenderProps {
  onSubmit: (data: AgentSenderFormProps) => void
  onCancel: () => void
}

export type {ChatBubbleItem, PageResult}

export interface AgentSseMessageContent {
  sseEventId: string
  assistantMessageId:number
  id: string
  type: typeof AGENT_CONTENT_TYPE.THINK
    | typeof AGENT_CONTENT_TYPE.ANSWER
    | typeof AGENT_CONTENT_TYPE.ERROR
    | typeof AGENT_CONTENT_TYPE.TOOL
    | typeof AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
    | typeof AGENT_CONTENT_TYPE.TOKEN_USAGE
    | typeof AGENT_CONTENT_TYPE.STREAM_END
    | typeof AGENT_CONTENT_TYPE.STREAM_STOP
    | typeof AGENT_CONTENT_TYPE.STREAM_START
    | typeof AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
}

export interface BlockRunningContentMetadata extends AgentSseMessageContent{
  status:NameValueEnumMetadata<string> | string
  creationTime:number,
  endTime?:number
}

export interface CustomizeContentMetadata extends AgentSseMessageContent {
  metadata?: Record<string, unknown>
}

export interface BlockDeltaContentMetadata extends BlockRunningContentMetadata {
  value?: string
}

export interface AgentToolCallBlock extends BlockDeltaContentMetadata {
  name:string
  outputText?:string,
  outputParts?:unknown[]
  resultState?:string
  hitlStatus:string,
  userConfirmed?:boolean,
  groupId:string
  type: typeof AGENT_CONTENT_TYPE.TOOL
}

export interface AgentThinkBlock extends BlockDeltaContentMetadata {
  type: typeof AGENT_CONTENT_TYPE.THINK,
  expanded?:boolean
}

export interface AgentAnswerBlock extends BlockDeltaContentMetadata {
  type: typeof AGENT_CONTENT_TYPE.ANSWER
  /** markdown | a2ui */
  format?: string
  sourceExit?: string
  hitlToolCallId?: string
  commands?: Record<string, unknown>[]
  surfaceId?: string
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

export interface AgentTokenUsageContent extends AgentSseMessageContent {
  inputTokens:number
  outputTokens:number
  cachedTokens:number
  usageType:NameValueEnumMetadata<string> | string
  type: typeof AGENT_CONTENT_TYPE.TOKEN_USAGE
}

export interface BlockGroup {
  groupId: string
  thinkBlock?: AgentThinkBlock
  answerBlock?: AgentAnswerBlock
  toolBlocks: AgentToolCallBlock[]
  errorBlock?: AgentErrorBlock
}

export interface ThoughtChainItemDataType extends ThoughtChainItemType {
  data: AgentToolCallBlock
}
