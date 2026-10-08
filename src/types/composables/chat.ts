import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {BubbleListProps} from '@loncra/antdv-chat'
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

export type {
  BubbleListCallbacks,
  BubbleListProps,
  BubbleRenderRow,
} from '@loncra/antdv-chat'

/** IM 气泡列表配置（含时间分隔间隔） */
export type ChatBubbleListProps = BubbleListProps & {
  timeDividerGap: number
}
