import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {BubbleListProps} from '@loncra/antdv-chat-pro'
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

export type ChatContentBlock = ImContentBlock | AgentContentBlock

export type BaseChatBubble = ChatBubbleBody<ChatContentBlock>

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
} from '@loncra/antdv-chat-pro'

export type ChatBubbleListProps = BubbleListProps & {
  timeDividerGap: number
}
