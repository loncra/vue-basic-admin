import type {
  IdValueMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  PageResult,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
  UserChatParticipantEntity
} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {
  CHAAT_ROOM_VIEW_MODAL_TYPE,
  CHAT_CALL_PRIVATE_ROLE_TYPE
} from "@/constants/messageConstant.ts";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";
import {
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  CHAT_CALL_UI_MODE,
} from "@/constants/messageConstant.ts";
import type {CSSProperties} from "vue";

export type ChatCallUiMode =
  | typeof CHAT_CALL_UI_MODE.EXPANDED
  | typeof CHAT_CALL_UI_MODE.MINIMIZED

export type ChatRoomViewModalOpenType =
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES

export interface AttachmentBlock {
  id:string
  type: 'custom'
  slotKind: 'files'
  files: ObjectWriteResult[]
}

export interface InstructionBlock {
  id:string
  type: 'custom',
  slotKind: 'instruction',
  value: IdValueMetadata<string, string>
  prefix: string
}

export interface ReferenceBlock {
  type: 'custom',
  slotKind: 'reference',
  value: UserChatMessageResponseBody[]
}

export interface CallBlock {
  type: 'custom'
  slotKind: 'call'
  userChatCallId:number
  caller:string
  scene:NameValueEnumMetadata<number>
  value:NameValueEnumMetadata<number>
  status:NameValueEnumMetadata<number>
}

export interface UndoBlock {
  slotKind: 'undo'
  type: 'custom'
  tooltip?:string
  value: string
}

export interface TextBlock {
  type: 'text',
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
  prefix:string
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
  data?:UserChatMessageResponseBody | UserChatMessageEntity,
  hide?:boolean
  flashPending?: boolean   // jump 时设为 true
  highlight?: boolean      // 进入可视区后设为 true，动画结束后清 false
}

export interface ServerConversationItem {
  key: string
  label: string
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
  participants:UserChatParticipantEntity[]
}

export type ChatCallPrivateSplitScreenType =
  | typeof CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT
  | typeof CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT

/** 视频流原始宽高，用于布局计算 */
export interface VideoMetrics {
  width: number
  height: number
  aspect: number
}

/** 布局可用区域上限 */
export interface LayoutConstraints {
  maxWidth: number
  maxHeight: number
}

export type CallPanelStyle = Pick<CSSProperties, 'width' | 'height'>

/** 私聊通话 modal / 各视频窗口尺寸规格 */
export interface CallLayoutSpec {
  modalWidth: number
  modalHeight: number
  local: CallPanelStyle
  remote: CallPanelStyle
}

export type ChatCallPrivateRoleType =
  | typeof CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL
  | typeof CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE
