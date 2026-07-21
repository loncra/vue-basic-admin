import type {CSSProperties, MaybeRef, Raw, Ref, VNode} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  ContactItem,
  IdValueMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  PageResult,
  RestResult,
  TimeProperties,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
  VersionEntityMetadata
} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {LocalAudioTrack, LocalVideoTrack, Room} from 'livekit-client'
import type {ChatConversationsApi} from '@/composables/message-server/chat/useChatConversations.ts'
import type {ChatMessageLoaderApi} from '@/composables/message-server/chat/useChatMessageLoader.ts'
import {
  CHAAT_ROOM_VIEW_MODAL_TYPE,
  CHAT_CALL_PRIVATE_ROLE_TYPE,
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  CHAT_CALL_UI_MODE
} from "@/constants";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";

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

export interface BaseChatBubble extends VersionEntityMetadata {
  content: ChatContentBlock[]
}

export type ChatBubbleItem = {
  key: string | number
  role: BubbleItemType["role"]
  content: ChatContentBlock[] | ChatContentBlock | string
  data?:BaseChatBubble,
  hide?:boolean
  flashPending?: boolean   // jump 时设为 true
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

/** 加载器需要的会话视图能力（由 ChatView defineExpose 提供） */
export interface ChatViewController {
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
  getSenderSlotConfigValue(): SlotConfigType[]
}

export interface ProvideUserChatContextOptions {
  /** ChatView 实例引用，供加载器执行滚动 / 跳转 / 取草稿 */
  view: Ref<ChatViewController | undefined>
  /** 刷新活跃会话头部额外内容（ChatConversation.changeMessageExtraContent） */
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
}

export interface UserChatContext {
  conversationActive: Ref<ConversationActiveProps>
  conversations: ChatConversationsApi
  loader: ChatMessageLoaderApi
  /** 按会话实体激活（含头部刷新）；传 undefined 清空 */
  activateConversation: (body: UserChatConversationResponseBody | undefined, messageId?: number) => Promise<void>
  /** 全量刷新会话列表并保持当前激活态 */
  refreshConversations: () => Promise<void>
}

export interface ChatBubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  throttleCollectVisibleUnreadWait: number
  topThreshold: number
  timeDividerGap: number
}

export interface ChatBubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReedit: (content: ChatContentBlock[]) => void
  onReferenceMessage: (message: UserChatMessageResponseBody) => void
  onReloadLastPage: () => void
}

export interface UseChatCallModalParams {
  closeTimerValue: Ref<TimeProperties>
}

export interface ChatCallModalProps {
  title: string
  width?: number
  height?: number
  fullscreen?: boolean
  uiMode?: ChatCallUiMode
  loading: boolean
}

export interface ChatCallModalInnerProps extends ChatCallModalProps {
  open: boolean
  closeTimerValue?: number
}

export interface ChatCallModalContext {
  modal: ChatCallModalProps
  room?: Raw<Room>
  userChatCall?: UserChatCallResponseBody
  previewTrack?: {
    video?: Raw<LocalVideoTrack>
    audio?: Raw<LocalAudioTrack>
  }
  leftButton?: VNode[]
}

export interface ChatCallModelExpose {
  context: ChatCallModalContext
  openChatCallModal: (
    title: string,
    _userChatCall: UserChatCallResponseBody
  ) => void
  handleCancel: () => void
  acceptCall: (
    key: string,
    callEntity: UserChatCallResponseBody,
    loading: Ref<boolean>
  ) => void
  rejectedCall: (
    key: string,
    callEntity: UserChatCallEntity,
    loading: Ref<boolean>
  ) => void
  acceptCallByChatCallId: (
    key: string,
    userChatCallId: number,
    loading: Ref<boolean>
  ) => void
  rejectedCallByChatCallId: (
    key: string,
    userChatCallId: number,
    loading: Ref<boolean>
  ) => void
  createChatCallAction: (
    userChatCallId: number,
    onAccept: (key: string, id: number, loading: Ref<boolean>) => void,
    onRejected: (key: string, id: number, loading: Ref<boolean>) => void
  ) => VNode
  updateParticipant: (participant: UserChatCallParticipantEntity) => void
  setCallFullscreen: (active: boolean) => void
  setCallUiMode: (mode: ChatCallUiMode) => void
  toggleCallMinimize: () => Promise<void>
}

export interface CallMediaState {
  microphoneEnabled: boolean
  cameraEnabled: boolean
}

export interface ChatCallMediaExpose {
  localParticipantVideoRef: Ref<HTMLVideoElement | undefined>
  remoteParticipantVideoRef: Ref<HTMLVideoElement | undefined>
  streamMetrics: Ref<{local?: VideoMetrics; remote?: VideoMetrics}>
  mediaOptions: Ref<CallMediaState>
  remoteMediaState: Ref<CallMediaState>
  startLocalPreview: () => Promise<void>
  reattachVideoElements: () => Promise<void>
  toggleMicrophone: () => Promise<void>
  toggleCamera: () => Promise<void>
  bindVideoMetrics: (el: HTMLVideoElement | undefined, role: ChatCallPrivateRoleType) => void
  refreshStreamMetrics: (role: ChatCallPrivateRoleType) => void
}

export interface TargetParticipant extends UserChatCallParticipantEntity {
  badgeStatus: string
}

export interface PrivateLayoutOptions {
  targetFullWindow: boolean
  splitScreenType: ChatCallPrivateSplitScreenType
}

export interface UseChatMessageSenderParams {
  refMessages: Ref<UserChatMessageResponseBody[]>
  sending: MaybeRef<boolean>
  getUploadOptions: () => Record<string, unknown> | undefined
  onSubmit: (content: ChatContentBlock[]) => void
  /** 由 LInstructionSender 暴露的 sender 实例 */
  getSender: () => SenderRef | undefined
}

export interface ChatSocketEventsOptions {
  conversationActive: Ref<ConversationActiveProps>
  conversations: ChatConversationsApi
  /** 当前是否已挂载会话视图（决定收到消息时是否合入气泡列表） */
  hasView: () => boolean
  /** 刷新活跃会话头部额外内容（ChatConversation.changeMessageExtraContent） */
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
  /** 重新激活某会话（MyChatMessage.setActiveConversationItemByEntity） */
  activateConversation: (
    body: UserChatConversationResponseBody | undefined,
  ) => Promise<void> | void
}

export interface ChatRoomSettingsCallbacks {
  onAddParticipant: (
    info: ContactItem[],
    result: RestResult<UserChatConversationResponseBody>,
  ) => void
  onDeleteConversation: (body: UserChatConversationResponseBody) => void
  onHistoryClick: (data: UserChatMessageResponseBody) => void
}

export interface UseChatNotificationParam {
  chatCallConfig: UseChatCallModalParams
}
