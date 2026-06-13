import type {
  ObjectWriteResult,
  PageResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {CHAAT_ROOM_VIEW_MODAL_TYPE} from "@/constants/messageConstant.ts";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";

export type TextSegment =
  | { type: 'plain'; text: string }
  | { type: 'mention'; value: string; label: string }
  | { type: 'emoji'; value: string; label: string }

export type ChatRoomViewModalOpenType =
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING

export interface TextSegmentContentBlock {
  type: 'custom',
  slotKind: 'textSegment',
  segments: TextSegment[]
}

export interface AttachmentBlock {
  type: 'custom',
  slotKind: 'files',
  files: ObjectWriteResult[]
}

export interface TextBlock {
  type: 'text',
  value: string
}

export type ChatContentBlock =
  | TextSegmentContentBlock
  | AttachmentBlock
  | TextBlock

export type FilesSlotProps = {
  slotKind: 'files'
  defaultValue: UploadFile<ObjectWriteResult>[]
}

export type CursorContext = {
  slotIdx: number
  textOffset: number
  isAtLineStart: boolean
}

export type ChatBubbleItem = {
  key: string | number
  role: BubbleItemType["role"]
  content: ChatContentBlock[] | ChatContentBlock | string
  data?:UserChatMessageResponseBody | UserChatMessageEntity
}

export interface ServerConversationItem {
  key: string
  label?: string
  data?: UserChatConversationResponseBody
}

export interface ConversationActiveProps {
  item: ServerConversationItem | undefined
  drawerOpen:boolean
  loading: boolean
  loadConversationDataLock:boolean
  sending?: boolean
  // 是否已加载出首页
  isOnFirstPage?:boolean
  // 是否已加载出尾页
  isOnLastPage?:boolean
  readableAnchorLoading:boolean | undefined
  dataSource: PageResult<UserChatMessageResponseBody>
  bubbleList: ChatBubbleItem[]
}
