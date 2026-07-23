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

export type ChatContentBlock =
  | AttachmentBlock
  | TextBlock
  | ReferenceBlock
  | UndoBlock
  | InstructionBlock
  | CallBlock

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
  timeDividerGap: number
}

export interface BubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReloadLastPage?: () => void
  /**
   * 可选。传入时注册：滚动节流 / items watch / focus / visibilitychange。
   * 参数为当前视口内全部非 divider 气泡，业务方自行过滤。
   */
  onVisibleItems?: (items: ChatBubbleItem[], scrollBox: HTMLElement) => void
}

/** @deprecated 使用 BubbleListProps */
export type ChatBubbleListProps = BubbleListProps & {
  throttleCollectVisibleUnreadWait?: number
}
