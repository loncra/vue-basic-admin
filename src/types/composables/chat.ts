import type {UserChatMessageResponseBody} from '@/types/apis'
import type {
  IdValueMetadata,
  NameValueEnumMetadata,
  PageResult,
} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
// 形状来源 = 规范包 `@loncra/chat-core`（本地只做**收窄/扩展**：块联合、role、渲染态字段）
import type {
  ActiveChatSession as CoreActiveChatSession,
  ChatBubbleItem as CoreChatBubbleItem,
  ChatMessageBase,
} from '@loncra/chat-core'
import type {
  AgentAnswerBlock,
  AgentErrorBlock,
  AgentThinkBlock,
  AgentToolCallBlock,
} from "@/types/composables";

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
  | AgentThinkBlock
  | AgentToolCallBlock
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

/** 消息体（UI 叠层）：把规范的信封 `ChatBlockBase` 收窄成宿主的块联合 `ChatContentBlock` */
export interface BaseChatBubble extends ChatMessageBase<ChatContentBlock> {
  content: ChatContentBlock[]
}

/**
 * **存储条目**（`ActiveChatSession.dataSource.elements` 里那一条）。
 *
 * ⚠️ **A1（2026-10-01 S2b-2）：这里没有 `content`** —— 内容从 `data` 派生
 * （`toBubbleContent(item)`，见 `@loncra/chat-core`）⇒ 结构上不可能再出现"只改了 content 没改 data"。
 * 要渲染态（带 content）请用下面的 `ChatBubbleRenderItem`。
 */
export type ChatBubbleItem = CoreChatBubbleItem<ChatContentBlock> & {
  role: BubbleItemType['role']
  /** ax-bubble loading；Agent 也可由 role 函数动态计算 */
  loading?: boolean
}

/**
 * **渲染项**：喂给 `ax-bubble-list` 的那一份 = 存储条目 + `toBubbleContent` 派生出来的 `content`。
 *
 * 组件里读 `item.content` 的地方收的是**这个**类型（`renderItem` 的产物），不是存储条目。
 */
export type ChatBubbleRenderItem = ChatBubbleItem & {
  content: ChatContentBlock[] | ChatContentBlock | string
}

/**
 * IM / Agent 活跃会话共同基类；LBubbleList 直接消费。
 * dataSource.elements 即为气泡列表（业务体挂在 ChatBubbleItem.data）。
 */
export interface ActiveChatSession extends CoreActiveChatSession {
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: PageResult<ChatBubbleItem>
}

// 容器契约（滚动参数 / 回调）已进实现包 `antdv-chat/src/bubble-list/types.ts`
// 这里**再导出**（名字不变 ⇒ 16 处调用点零改动）；泛型默认 = 规范的 `ChatBubbleItem`
import type {BubbleListCallbacks, BubbleListProps} from '@loncra/antdv-chat'
export type {BubbleListCallbacks, BubbleListProps}

/** IM 气泡列表配置（含时间分隔间隔） */
export type ChatBubbleListProps = BubbleListProps & {
  timeDividerGap: number
}
