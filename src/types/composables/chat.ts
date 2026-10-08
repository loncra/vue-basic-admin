import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {
  ActiveChatSession as CoreActiveChatSession,
  AgentChatBubble,
  AgentContentBlock,
  ChatBubbleBody,
  ChatBubbleItem as CoreChatBubbleItem,
  ImChatBubble,
  ImContentBlock,
  TextBlock,
} from '@loncra/chat-core'

export type {
  AttachmentBlock,
  CallBlock,
  InstructionBlock,
  ReferenceBlock,
  TextBlock,
  UndoBlock,
} from '@loncra/chat-core'

/** IM 词槽与 Agent 词槽。两边共用的文本、附件、点名在两个联合里各出现一次。 */
export type ChatContentBlock = ImContentBlock | AgentContentBlock

export type BaseChatBubble = ChatBubbleBody<ChatContentBlock>

/** 一条 IM 消息、一条 Agent 消息，或一条纯文本展示行。 */
export type ChatBubbleItem = ImChatBubble | AgentChatBubble | CoreChatBubbleItem<TextBlock>

export type ActiveChatSession = CoreActiveChatSession<ChatBubbleItem>

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

export interface BubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  /** 可见区回调节流；仅当提供 onVisibleItems 时生效 */
  throttleCollectVisibleWait: number
  topThreshold: number
}

/** 渲染行。bubble 是列表里的那条；rootClass 只给 ax-bubble 的外层。 */
export interface BubbleRenderRow {
  bubble: ChatBubbleItem
  rootClass?: string
}

export interface BubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReloadLastPage?: () => void
  /**
   * 可选。传入时注册：滚动节流 / items watch / focus / visibilitychange。
   * 参数为当前视口内全部非 divider 气泡，业务方自行过滤。
   */
  onVisibleItems?: (items: ChatBubbleItem[], scrollBox: HTMLElement) => void
  renderItem: (items: ChatBubbleItem[]) => BubbleRenderRow[]
}

/** IM 气泡列表配置（含时间分隔间隔） */
export type ChatBubbleListProps = BubbleListProps & {
  timeDividerGap: number
}
