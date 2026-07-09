import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  markRaw,
  provide,
  type Raw,
  type Ref,
  ref,
  type VNode
} from "vue";
import type {
  RestResult,
  TimeProperties,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody
} from "@/types/apis";
import {createIcon, exitDocumentFullscreenIfNeeded, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";
import {useSocketSubscriptions} from "@/composables";
import {
  CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY,
  MESSAGE_GROUP,
  SOCKET_EVENT_TYPE
} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {isBusinessSuccess} from "@/requests";
import {AuthServerService} from "@/apis";
import {useAppNotification} from "@/composables/useAppNotification.ts";
import useApp from "antdv-next/dist/app/useApp";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {Button, Space} from "antdv-next";
import {LocalAudioTrack, type LocalVideoTrack, Room} from "livekit-client";

export interface UseChatCallModelParams {
  closeTimerValue: Ref<TimeProperties>;
}

export interface ChatCallModalProps {
  title:string
  width?:number
  height?:number
  fullscreen?:boolean
  loading:boolean
}

export interface ChatCallModalInnerProps extends ChatCallModalProps{
  open: boolean
  closeTimerValue?:number
}

export interface ChatCallModelContext {
  modal:ChatCallModalProps,
  room?:Raw<Room>,
  userChatCall?:UserChatCallResponseBody,
  previewTrack?:{
    video?: Raw<LocalVideoTrack>
    audio?: Raw<LocalAudioTrack>
  }
}

export interface ChatCallModelExpose {
  context:ChatCallModelContext,
  openChatCallModal:(
    title:string,
    _userChatCall:UserChatCallResponseBody
  ) => void,
  handleCancel:() => void,
  acceptCall:(
    key:string,
    callEntity:UserChatCallResponseBody,
    loading:Ref<boolean>
  ) => void,
  rejectedCall:(
    key:string,
    callEntity:UserChatCallEntity,
    loading:Ref<boolean>
  ) => void,
  acceptCallByChatCallId:(
    key:string,
    userChatCallId:number,
    loading:Ref<boolean>
  ) => void,
  rejectedCallByChatCallId:(
    key:string,
    userChatCallId:number,
    loading:Ref<boolean>
  ) => void,
  createChatCallAction: (
    userChatCallId: number,
    onAccept: (key: string, id: number, loading: Ref<boolean>) => void,
    onRejected: (key: string, id: number, loading: Ref<boolean>) => void
  ) => VNode,
  updateParticipant:(participant:UserChatCallParticipantEntity) => void,
  setCallFullscreen:(active: boolean) => void,
}

export function provideChatCllExpose(config:UseChatCallModelParams) {
  const {on} = useSocketSubscriptions()
  const { destroy } = useAppNotification()
  const { message } = useApp()
  const messageServerStore = useMessageServerStore()

  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const context = ref<ChatCallModelContext>({
    modal:{
      loading: false,
      open:false,
      title:' '
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
