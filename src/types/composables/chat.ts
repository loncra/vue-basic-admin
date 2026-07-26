import type {
  IdValueMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  PageResult,
  UserChatMessageResponseBody,
  VersionEntityMetadata,
} from '@/types/apis'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {AGENT_CONTENT_TYPE} from "@/constants";

export interface AttachmentBlock {
  id: string
  type: 'custom'
  slotKind: 'files'
  files: ObjectWriteResult[]
}

export interface InstructionBlock {
  id: string
  type: 'custom'
  slotKind: 'instruction'
  value: IdValueMetadata<string, string>
  prefix: string
}

export interface ReferenceBlock {
  type: 'custom'
  slotKind: 'reference'
  value: UserChatMessageResponseBody[]
}

export interface CallBlock {
  type: 'custom'
  slotKind: 'call'
  userChatCallId: number
  caller: string
  scene: NameValueEnumMetadata<number>
  value: NameValueEnumMetadata<number>
  status: NameValueEnumMetadata<number>
}

export interface UndoBlock {
  slotKind: 'undo'
  type: 'custom'
  tooltip?: string
  value: string
}

export interface TextBlock {
  type: 'text'
  value: string
}

export interface AgentSseMessageContent {
  sseEventId: string
  id:string
  type: typeof AGENT_CONTENT_TYPE.THINK
    | typeof AGENT_CONTENT_TYPE.ANSWER
    | typeof AGENT_CONTENT_TYPE.ERROR
    | typeof AGENT_CONTENT_TYPE.TOOL_START
    | typeof AGENT_CONTENT_TYPE.TOOL_END
    | typeof AGENT_CONTENT_TYPE.TOOL
    | typeof AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
}

export interface AgentTextMessageContent extends AgentSseMessageContent{
  value?: string
}

export interface AgentThinkBlock extends AgentTextMessageContent {
  type: typeof AGENT_CONTENT_TYPE.THINK
}

export interface AgentAnswerBlock extends AgentTextMessageContent {
  type: typeof AGENT_CONTENT_TYPE.ANSWER
}

export interface AgentErrorBlock extends AgentTextMessageContent {
  type: typeof AGENT_CONTENT_TYPE.ERROR
}

export interface AgentStatusChangeSse extends AgentSseMessageContent {
  type: typeof AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
  status: NameValueEnumMetadata<number> | number
}

export interface AgentToolBlockProps extends AgentSseMessageContent {
  creationTime:number
  name: string
  input?: unknown
  status?: NameValueEnumMetadata<string>
  endTime?:number
  output?: unknown
  resultState:string
}

export interface AgentToolStartBlock extends AgentToolBlockProps {
  type: typeof AGENT_CONTENT_TYPE.TOOL_START
}

export interface AgentToolEndBlock extends AgentToolBlockProps {
  type: typeof AGENT_CONTENT_TYPE.TOOL_END
}

export interface AgentToolBlock extends AgentToolBlockProps {
  type: typeof AGENT_CONTENT_TYPE.TOOL
}

export type ChatContentBlock =
  | AttachmentBlock
  | TextBlock
  | ReferenceBlock
  | UndoBlock
  | InstructionBlock
  | CallBlock
  | AgentThinkBlock
  | AgentToolBlock
  | AgentToolStartBlock
  | AgentToolEndBlock
  | AgentAnswerBlock
  | AgentErrorBlock

export type FilesSlotProps = {
  slotKind: 'files'
  defaultValue: UploadFile<ObjectWriteResult>[]
}

export type InstructionSlotProps = {
  slotKind: 'instruction'
  defaultValue: IdValueMetadata<string, string>
  prefix: string
}

export type CursorContext = {
  slotIdx: number
  textOffset: number
  isAtLineStart: boolean
}

export interface BaseChatBubble extends VersionEntityMetadata {
  content: ChatContentBlock[]
}

export type ChatBubbleItem = {
  key: string | number
  role: BubbleItemType['role']
  content: ChatContentBlock[] | ChatContentBlock | string
  data?: BaseChatBubble
  hide?: boolean
  flashPending?: boolean
  /** ax-bubble loading；Agent 也可由 role 函数动态计算 */
  loading?: boolean
}

/**
 * IM / Agent 活跃会话共同基类；LBubbleList 直接消费。
 * dataSource.elements 即为气泡列表（业务体挂在 ChatBubbleItem.data）。
 */
export interface ActiveChatSession {
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: PageResult<ChatBubbleItem>
}

export interface BubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  /** 可见区回调节流；仅当提供 onVisibleItems 时生效 */
  throttleCollectVisibleWait: number
  topThreshold: number
}

export interface BubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReloadLastPage?: () => void
  /**
   * 可选。传入时注册：滚动节流 / items watch / focus / visibilitychange。
   * 参数为当前视口内全部非 divider 气泡，业务方自行过滤。
   */
  onVisibleItems?: (items: ChatBubbleItem[], scrollBox: HTMLElement) => void
  renderItem:(items:ChatBubbleItem[]) => BubbleItemType[]
}

/** IM 气泡列表配置（含时间分隔间隔） */
export type ChatBubbleListProps = BubbleListProps & {
  timeDividerGap: number
}
