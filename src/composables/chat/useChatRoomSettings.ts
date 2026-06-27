import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  type Ref,
  ref,
  watch,
} from 'vue'
import type {
  ContactItem,
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
} from '@/types/apis'
import type {ChatRoomViewModalOpenType} from '@/types/composables'
import {AuthServerService} from '@/apis'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {useConversationActions} from '@/composables/chat/useConversationActions.ts'
import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import useApp from 'antdv-next/dist/app/useApp'
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {CHAAT_ROOM_VIEW_MODAL_TYPE, SOCKET_EVENT_TYPE} from '@/constants/messageConstant.ts'
import {parseSocketRestPayload} from '@/types/socket.ts'
import {useChatContext} from "@/composables";

export interface ChatRoomSettingsCallbacks {
  onAddParticipant: (
    info: ContactItem[],
    result: RestResult<UserChatConversationResponseBody>,
  ) => void
  onDeleteConversation: (body: UserChatConversationResponseBody) => void
  onHistoryClick: (data: UserChatMessageResponseBody) => void
}

/**
 * 房间设置抽屉逻辑：成员加载、改名、置顶/免打扰、增删成员、退出/解散、弹窗与历史入口。
 */
export function useChatRoomSettings(
  getContacts: () => ContactItem[],
  callbacks: ChatRoomSettingsCallbacks,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties
  const {message, modal} = useApp()

  const {conversationActive, loader} = useChatContext()
  const principalStore = usePrincipalStore()
  const conversationActions = useConversationActions()
  const {on} = useSocketSubscriptions()

  const conversation = computed(() => conversationActive.value.item?.data)
  const participants = computed(() => conversationActive.value.participants)
  //const participants = ref<UserChatParticipantEntity[]>([])
  const loading = ref<boolean>(false)
  // 显式断言为 Ref<T>，避免 UnwrapRef 对 currentConversation 深度递归（TS2589）
  const options = ref<{
    editName: boolean
    currentConversation?: UserChatConversationResponseBody
    selectedUser: ContactItem[]
  }>({
    editName: false,
    selectedUser: [],
  }) as Ref<{
    editName: boolean
    currentConversation?: UserChatConversationResponseBody
    selectedUser: ContactItem[]
  }>
  const modalOptions = ref<{
    open: boolean
    title?: string
    footer: boolean
    type?: ChatRoomViewModalOpenType
    confirmLoading?: boolean
  }>({
    open: false,
    footer: true,
  })

  const systemUserPanelDataSource = computed<ContactItem[]>(() => {
    if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT) {
      return getContacts()
    }
    if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING) {
      return conversationActive.value.participants
        .filter((p) => !principalStore.isCurrentPrincipal(p.principal))
        .map(toContactItem)
    }
    return []
  })

  function toContactItem(p: UserChatParticipantEntity): ContactItem {
    return {
      key: String(p.metadata.details.id),
      label: String(AuthServerService.getPrincipalNameByUserDetails(p.metadata.details)),
      data: p.metadata.details,
      participantType: p.type,
    }
  }

  function onChatParticipantRefreshByRoomId(restResult: RestResult<number>): void {
    if (!options.value.currentConversation || !options.value.currentConversation?.room.id) {
      return
    }
    if (options.value.currentConversation?.room.id !== restResult.data) {
      return
    }
    loadParticipant()
  }

  /*async function mounted(): Promise<void> {
    if (!conversation.value) {
      return
    }
    if (
      options.value.currentConversation &&
      options.value.currentConversation.id === conversation.value.id
    ) {
      return
    }
    options.value.currentConversation = {...conversation.value}
    await loadParticipant()
  }*/

  async function loadParticipant(): Promise<void> {
    if (!conversation.value || getEnumValue(conversation.value?.status) !== 10) {
      return
    }
    try {
      loading.value = true
      await loader.loadParticipant(Number(conversation.value?.room?.id))
    } finally {
      loading.value = false
    }
  }

  function onFilterSystemUser(item: ContactItem): boolean {
    if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT) {
      return !conversationActive.value.participants.map((d) => d.metadata.details.id).includes(item.data.id)
    }
    return true
  }

  async function confirmAddParticipant(): Promise<void> {
    if (!conversation.value) {
      return
    }
    if (options.value.selectedUser.length <= 0 || !conversation.value.room?.id) {
      return
    }
    const principals = options.value.selectedUser.map((d) => d.data).map((u) => u.systemName)
    try {
      modalOptions.value.confirmLoading = true
      const result: RestResult<UserChatConversationResponseBody> =
        await ChatMessageService.addRoomParticipant(Number(conversation.value.room.id), principals)
      callbacks.onAddParticipant(options.value.selectedUser, result)
      onModalCancel()
    } finally {
      modalOptions.value.confirmLoading = false
    }
  }

  async function onRename(): Promise<void> {
    if (!options.value.currentConversation) {
      return
    }
    try {
      loading.value = true
      const result: RestResult<void> = await ChatMessageService.roomRename(
        Number(options.value.currentConversation.room.id),
        String(options.value.currentConversation.name),
      )
      message.success(result.message)
      options.value.editName = false
    } finally {
      loading.value = false
    }
  }

  function onCancelRename(): void {
    if (!conversation.value || !options.value.currentConversation) {
      return
    }
    options.value.currentConversation.name = conversation.value.name
    options.value.editName = false
  }

  async function onPinnedChange(): Promise<void> {
    if (!conversation.value) {
      return
    }
    try {
      loading.value = true
      const data = await conversationActions.togglePinned([Number(conversation.value.id)])
      const c = data.at(0)
      if (c) {
        conversation.value.pinned = c.pinned
      }
    } finally {
      loading.value = false
    }
  }

  async function onMutedChange(): Promise<void> {
    if (!conversation.value) {
      return
    }
    try {
      loading.value = true
      const data = await conversationActions.toggleMuted([Number(conversation.value.id)])
      const c = data.at(0)
      if (c) {
        conversation.value.muted = c.muted
      }
    } finally {
      loading.value = false
    }
  }

  function onModalCancel(): void {
    modalOptions.value.open = false
    options.value.selectedUser = []
  }

  function onAddParticipant(): void {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT
    modalOptions.value.title = globalProperties.$t('chat.roomView.addParticipant')
    modalOptions.value.open = true
    modalOptions.value.footer = true
  }

  function onMemberSetting(): void {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING
    modalOptions.value.title = globalProperties.$t('chat.roomView.memberManager')
    modalOptions.value.open = true
    modalOptions.value.footer = true
  }

  function onOpenHistories(): void {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES
    modalOptions.value.title = globalProperties.$t('chat.roomView.histories.title', {
      name: conversation.value.name,
    })
    modalOptions.value.open = true
    modalOptions.value.footer = false
  }

  function onHistoryClick(data: UserChatMessageResponseBody): void {
    callbacks.onHistoryClick(data)
    onModalCancel()
  }

  async function onUpdateParticipantType(type: number): Promise<void> {
    const principals = options.value.selectedUser.map((d) => d.data).map((u) => u.systemName)
    if (principals.length <= 0) {
      return
    }
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    try {
      modalOptions.value.confirmLoading = true
      const result: RestResult<void> = await ChatMessageService.updateParticipantType(
        conversation.value.room.id,
        type,
        principals,
      )
      message.success(result.message)
      onModalCancel()
    } finally {
      modalOptions.value.confirmLoading = false
    }
  }

  async function onRemoveMember(): Promise<void> {
    const principals = options.value.selectedUser.map((d) => d.data).map((u) => u.systemName)
    if (principals.length <= 0) {
      return
    }
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    try {
      modalOptions.value.confirmLoading = true
      const result: RestResult<void> = await ChatMessageService.removeRoomParticipant(
        conversation.value.room.id,
        principals,
      )
      message.success(result.message)
      await loadParticipant()
      onModalCancel()
    } finally {
      modalOptions.value.confirmLoading = false
    }
  }

  function onExist(): void {
    if (!conversation.value) {
      return
    }
    if (getEnumValue(conversation.value.status) === 10) {
      modal.confirm({
        title: globalProperties.$t('chat.roomView.exitRoom.title'),
        content: globalProperties.$t('chat.roomView.exitRoom.content', {
          name: conversation.value.name,
        }),
        onOk: () => doExist(),
      })
    } else {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doConversationDelete(conversation.value),
      })
    }
  }

  function onDisbandRoom(): void {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    modal.confirm({
      title: globalProperties.$t('chat.roomView.disbandRoom.title'),
      content: globalProperties.$t('chat.roomView.disbandRoom.content', {
        name: conversation.value.name,
      }),
      onOk: () => doDisbandRoom(),
    })
  }

  async function doDisbandRoom(): Promise<void> {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    try {
      loading.value = true
      const result: RestResult<void> = await ChatMessageService.disbandRoom(
        conversation.value.room.id,
      )
      message.success(result.message)
    } finally {
      loading.value = false
    }
  }

  async function doConversationDelete(
    body: UserChatConversationResponseBody | undefined,
  ): Promise<void> {
    if (!body) {
      return
    }
    const success = await conversationActions.removeConversations([Number(body.id)])
    if (success) {
      callbacks.onDeleteConversation(body)
    }
  }

  async function doExist(): Promise<void> {
    if (!conversation.value || !conversation.value.room?.id) {
      return
    }
    try {
      loading.value = true
      const result: RestResult<void> = await ChatMessageService.existRoom(
        conversation.value.room.id,
      )
      message.success(result.message)
    } finally {
      loading.value = false
    }
  }

  on(SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID, (payload) =>
    onChatParticipantRefreshByRoomId(parseSocketRestPayload<number>(payload)),
  )
  //onMounted(mounted)
  //watch(() => conversation.value, () => loadParticipant(), {deep: true})

  return {
    conversation,
    participants,
    globalProperties,
    principalStore,
    loading,
    options,
    modalOptions,
    systemUserPanelDataSource,
    onFilterSystemUser,
    confirmAddParticipant,
    onRename,
    onCancelRename,
    onPinnedChange,
    onMutedChange,
    onModalCancel,
    onAddParticipant,
    onMemberSetting,
    onOpenHistories,
    onHistoryClick,
    onUpdateParticipantType,
    onRemoveMember,
    onExist,
    onDisbandRoom,
  }
}

export type ChatRoomSettingsApi = ReturnType<typeof useChatRoomSettings>
