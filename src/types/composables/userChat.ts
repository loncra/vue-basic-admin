import type {CSSProperties, MaybeRef, Raw, Ref, VNode} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
  ContactItem,
  RestResult,
  TimeProperties,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
} from '@/types/apis'
import type {LocalAudioTrack, LocalVideoTrack, Room} from 'livekit-client'
import type {ChatConversationsApi} from '@/composables/message-server/chat/useChatConversations.ts'
import type {ChatMessageLoaderApi} from '@/composables/message-server/chat/useChatMessageLoader.ts'
import {
  CHAAT_ROOM_VIEW_MODAL_TYPE,
  CHAT_CALL_PRIVATE_ROLE_TYPE,
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  CHAT_CALL_UI_MODE,
} from '@/constants'
import type {
  ActiveChatSession,
  ChatBubbleItem,
  ChatContentBlock,
} from '@/types/composables/chat.ts'

export type ChatCallUiMode =
  | typeof CHAT_CALL_UI_MODE.EXPANDED
  | typeof CHAT_CALL_UI_MODE.MINIMIZED

export type ChatRoomViewModalOpenType =
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING
  | typeof CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES

export interface ServerConversationItem {
  key: string
  label: string
  data?: UserChatConversationResponseBody
}

export interface UserChatConversationActiveProps extends ActiveChatSession {
  item: ServerConversationItem | undefined
  drawerOpen: boolean
  sending?: boolean
  readableAnchorLoading?: boolean
  participants: UserChatParticipantEntity[]
}

export type ChatCallPrivateSplitScreenType =
  | typeof CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT
  | typeof CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT

export interface VideoMetrics {
  width: number
  height: number
  aspect: number
}

export interface LayoutConstraints {
  maxWidth: number
  maxHeight: number
}

export type CallPanelStyle = Pick<CSSProperties, 'width' | 'height'>

export interface CallLayoutSpec {
  modalWidth: number
  modalHeight: number
  local: CallPanelStyle
  remote: CallPanelStyle
}

export type ChatCallPrivateRoleType =
  | typeof CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL
  | typeof CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE

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
  view: Ref<ChatViewController | undefined>
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
}

export interface UserChatContext {
  conversationActive: Ref<UserChatConversationActiveProps>
  conversations: ChatConversationsApi
  loader: ChatMessageLoaderApi
  activateConversation: (
    body: UserChatConversationResponseBody | undefined,
    messageId?: number,
  ) => Promise<void>
  refreshConversations: () => Promise<void>
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
  openChatCallModal: (title: string, _userChatCall: UserChatCallResponseBody) => void
  handleCancel: () => void
  acceptCall: (
    key: string,
    callEntity: UserChatCallResponseBody,
    loading: Ref<boolean>,
  ) => void
  rejectedCall: (
    key: string,
    callEntity: UserChatCallEntity,
    loading: Ref<boolean>,
  ) => void
  acceptCallByChatCallId: (
    key: string,
    userChatCallId: number,
    loading: Ref<boolean>,
  ) => void
  rejectedCallByChatCallId: (
    key: string,
    userChatCallId: number,
    loading: Ref<boolean>,
  ) => void
  createChatCallAction: (
    userChatCallId: number,
    onAccept: (key: string, id: number, loading: Ref<boolean>) => void,
    onRejected: (key: string, id: number, loading: Ref<boolean>) => void,
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
  getSender: () => SenderRef | undefined
}

export interface ChatSocketEventsOptions {
  conversationActive: Ref<UserChatConversationActiveProps>
  conversations: ChatConversationsApi
  hasView: () => boolean
  refreshActiveHeader: (item: ServerConversationItem | undefined) => void
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

export type {ChatBubbleItem}
