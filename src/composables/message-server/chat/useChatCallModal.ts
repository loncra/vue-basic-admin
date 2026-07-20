import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  markRaw,
  provide,
  type Ref,
  ref
} from "vue";
import type {
  RestResult,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody
} from "@/types/apis";
import {
  createIcon,
  exitDocumentFullscreenIfNeeded,
  getEnumValue,
  requireNonNullOrUndefined
} from "@/utils";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";
import {useSocketSubscriptions} from "@/composables";
import {
  CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY,
  CHAT_CALL_UI_MODE,
  MESSAGE_GROUP,
  SOCKET_EVENT_TYPE
} from "@/constants";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {isBusinessSuccess} from "@/requests";
import {useAppNotification} from "@/composables/useAppNotification.ts";
import useApp from "antdv-next/dist/app/useApp";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {Button, Space} from "antdv-next";
import {Room} from "livekit-client";
import type {
  ChatCallModalContext,
  ChatCallModalInnerProps,
  ChatCallModelExpose,
  ChatCallUiMode,
  UseChatCallModalParams,
} from "@/types/composables/chat.ts";

export function provideChatCallExpose(config:UseChatCallModalParams) {
  const {on} = useSocketSubscriptions()
  const { destroy } = useAppNotification()
  const { message } = useApp()
  const messageServerStore = useMessageServerStore()

  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const context = ref<ChatCallModalContext>({
    modal:{
      loading: false,
      open:false,
      title:' ',
      uiMode: CHAT_CALL_UI_MODE.EXPANDED,
    } as ChatCallModalInnerProps
  })

  async function openChatCallModal(
    title:string,
    _userChatCall:UserChatCallResponseBody
  ) {
    const modal = context.value.modal as ChatCallModalInnerProps
    modal.open = true;
    modal.title = title;

    context.value.userChatCall = _userChatCall;
    context.value.room = markRaw(new Room({
      // automatically manage subscribed video quality
      adaptiveStream: true,
      // optimize publishing bandwidth and CPU for published tracks
      dynacast: true,
    }));
  }

  function resetContext() {
    context.value.modal.width = undefined
    context.value.modal.height = undefined
    context.value.modal.fullscreen = false
    context.value.modal.uiMode = CHAT_CALL_UI_MODE.EXPANDED
    const innerModel = (context.value.modal as ChatCallModalInnerProps)
    if (innerModel.closeTimerValue) {
      innerModel.closeTimerValue = undefined
    }
    context.value.userChatCall = undefined

    if (context.value?.previewTrack?.audio) {
      context.value.previewTrack.audio.stop()
      context.value.previewTrack.audio = undefined
    }

    if (context.value?.previewTrack?.video) {
      context.value.previewTrack.video.stop()
      context.value.previewTrack.video = undefined
    }

    if (context.value.room) {
      context.value.room.disconnect()
      context.value.room = undefined
    }
  }

  async function handleCancel() {
    const modal = context.value.modal as ChatCallModalInnerProps
    try {
      modal.loading = true
      if (context.value.userChatCall && getEnumValue(context.value.userChatCall.status) !== 30) {
        await ChatCallService.completed(Number(context.value.userChatCall.id))
      }

      await exitDocumentFullscreenIfNeeded()
      modal.open = false
      resetContext()
    } finally {
      modal.loading = false
    }
  }

  function onChatCallComplete(result:RestResult<UserChatCallEntity>){
    onChatCallUpdate(result)
    if (!result.data) {
      return ;
    }
    const key = MESSAGE_GROUP.USER_CHAT_CALL + "_" + String(result.data.id)
    destroy(key)
    const modal = context.value.modal as ChatCallModalInnerProps
    if (modal.open) {
      modal.closeTimerValue = globalProperties.$dayjs().add(config.closeTimerValue.value.value, config.closeTimerValue.value.unit).valueOf()
    }
  }

  function onChatCallUpdate(result:RestResult<UserChatCallEntity>){
    if (!result.data) {
      return
    }
    if (!context.value.userChatCall) {
      return
    }

    context.value.userChatCall = {...context.value.userChatCall, ...result.data}
  }

  function updateParticipant(participant:UserChatCallParticipantEntity){
    if (!context.value.userChatCall) {
      return
    }
    const index = context.value.userChatCall.participants.findIndex(p => participant.id === p.id)
    if (index < 0) {
      return
    }
    context.value.userChatCall.participants[index] = participant
  }

  function setCallFullscreen(active: boolean) {
    context.value.modal.fullscreen = active
  }

  function setCallUiMode(mode: ChatCallUiMode) {
    context.value.modal.uiMode = mode
  }

  async function toggleCallMinimize() {
    const modal = context.value.modal
    const nextMode =
      modal.uiMode === CHAT_CALL_UI_MODE.MINIMIZED
        ? CHAT_CALL_UI_MODE.EXPANDED
        : CHAT_CALL_UI_MODE.MINIMIZED
    if (nextMode === CHAT_CALL_UI_MODE.MINIMIZED) {
      await exitDocumentFullscreenIfNeeded()
      modal.fullscreen = false
    }
    modal.uiMode = nextMode
  }

  async function acceptCallByChatCallId(
    key:string,
    userChatCallId:number,
    loading:Ref<boolean>
  ) {
    try {
      loading.value = true
      const result = await ChatCallService.getUserChatCall(userChatCallId, true)
      if (!result.data) {
        return
      }
      const body = result.data as UserChatCallResponseBody
      await acceptCall(key, body, loading)
    } finally {
      loading.value = false
    }
  }

  async function acceptCall(
    key:string,
    callEntity:UserChatCallResponseBody,
    loading:Ref<boolean>
  ) {
    try {
      loading.value = true

      destroy(key)
      await openChatCallModal(' ', callEntity)
      await messageServerStore.fetchUnreadQuantity()

      const result = await ChatCallService.accept(Number(callEntity.id))
      if (!result.data) {
        await handleCancel()
        return
      }

    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  async function rejectedCallByChatCallId(
    key:string,
    userChatCallId:number,
    loading:Ref<boolean>
  ) {
    try {
      loading.value = true
      const result = await ChatCallService.rejected(userChatCallId)
      if (isBusinessSuccess(result)) {
        destroy(key)
      }
      await messageServerStore.fetchUnreadQuantity()
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  async function rejectedCall(
    key:string,
    callEntity:UserChatCallEntity,
    loading:Ref<boolean>
  ) {
    await rejectedCallByChatCallId(key, Number(callEntity.id), loading)
  }

  function createChatCallAction(
    userChatCallId: number,
    onAccept: (key: string, id: number, loading: Ref<boolean>) => void,
    onRejected: (key: string, id: number, loading: Ref<boolean>) => void
  ) {
    const loading = ref<boolean>(false)
    const key = MESSAGE_GROUP.USER_CHAT_CALL + "_" + String(userChatCallId)
    return h(
      Space,
      {},
      () => [
        h(
          Button,
          {
            type: 'link',
            size: 'small',
            onClick: () => destroy(key),
          },
          {
            icon: () => createIcon('loncra-message-square-off', 'align'),
            default: () => globalProperties.$t('common.ignore')
          },
        ),
        h(
          Button,
          {
            variant: "solid",
            color: 'green',
            size: 'small',
            loading: loading.value,
            onClick: () => onAccept(key, userChatCallId, loading),
          },
          {
            icon: () => createIcon('loncra-message-square-check', 'align'),
            default: () => globalProperties.$t('common.accept')
          },
        ),
        h(
          Button,
          {
            danger: true,
            type: 'primary',
            size: 'small',
            loading: loading.value,
            onClick: () => onRejected(key, userChatCallId, loading),
          },
          {
            icon: () => createIcon('loncra-message-square-x', 'align'),
            default: () => globalProperties.$t('common.rejected')
          },
        )
      ])
  }

  function onChatCallParticipantUpdate(result:RestResult<UserChatCallParticipantEntity>){
    if (!result.data || !context.value.userChatCall) {
      return
    }
    const index = context.value.userChatCall.participants.findIndex(p => p.id === result.data?.id)
    if (index < 0) {
      return ;
    }
    context.value.userChatCall.participants[index] = {...context.value.userChatCall.participants[index], ...result.data}
  }

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_PARTICIPANT_UPDATE,
    (payload) => onChatCallParticipantUpdate(parseSocketRestPayload<UserChatCallParticipantEntity>(payload))
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_COMPLETED,
    (payload) => onChatCallComplete(parseSocketRestPayload<UserChatCallEntity>(payload))
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_UPDATE,
    (payload) => onChatCallUpdate(parseSocketRestPayload<UserChatCallEntity>(payload))
  )

  const exportContext:ChatCallModelExpose = {
    context:context.value,
    handleCancel:handleCancel,
    openChatCallModal:openChatCallModal,
    acceptCall:acceptCall,
    rejectedCall:rejectedCall,
    acceptCallByChatCallId:acceptCallByChatCallId,
    rejectedCallByChatCallId:rejectedCallByChatCallId,
    createChatCallAction:createChatCallAction,
    updateParticipant:updateParticipant,
    setCallFullscreen:setCallFullscreen,
    setCallUiMode:setCallUiMode,
    toggleCallMinimize:toggleCallMinimize,
  }

  provide(CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY, exportContext)

  return exportContext
}

export function useChatCallModalExpose(): ChatCallModelExpose {
  const ctx = inject<ChatCallModelExpose>(CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatCallModelContext() 必须在 provideChatContext() 的组件子树内调用')
  }
  return ctx
}
