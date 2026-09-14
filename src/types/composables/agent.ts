import type {NameValueEnumMetadata, PageResult} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {AgentConversationEntity} from '@loncra/client/ai'
import {AI_SERVER_AGENT_CHAT_STATUS, AI_SERVER_AGENT_CONTENT_TYPE} from '@loncra/client/ai'
import type {
  ActiveChatSession,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables/chat.ts'
import type {Ref} from 'vue'

import type {AgentMessageLoaderApi} from '@/composables/ai-server/agent/useAgentMessageLoader.ts'
import type {ThoughtChainItemType} from "@antdv-next/x";

export interface AgentConversationItem extends AgentConversationEntity {
  editing: boolean,
  original?: string
  draft?: ChatContentBlock[]
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

export type AgentChatStatus = (typeof AI_SERVER_AGENT_CHAT_STATUS)[keyof typeof AI_SERVER_AGENT_CHAT_STATUS]

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
  getSenderSlotConfigValue(): ChatContentBlock[]
  persistSenderDraft(): Promise<void>
  hydrateSenderDraft(): Promise<void>
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
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.THINK
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.ANSWER
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.ERROR
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.TOOL
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.TOKEN_USAGE
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_END
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_STOP
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_START
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
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
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.TOOL
}

export interface AgentThinkBlock extends BlockDeltaContentMetadata {
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.THINK,
  expanded?:boolean
}

export interface AgentAnswerBlock extends BlockDeltaContentMetadata {
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.ANSWER
}

export interface AgentErrorBlock extends CustomizeContentMetadata {
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.ERROR
  metadata:{
    message:string
  }
}

export interface GenerateConversationName extends CustomizeContentMetadata {
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
  metadata:{
    name:string
  }
}

export interface AgentStatusChangeSse extends AgentSseMessageContent {
  status:NameValueEnumMetadata<number> | number
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
}

export interface AgentTokenUsageContent extends AgentSseMessageContent {
  inputTokens:number
  outputTokens:number
  cachedTokens:number
  usageType:NameValueEnumMetadata<string> | string
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.TOKEN_USAGE
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
