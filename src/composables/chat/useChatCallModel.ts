import {
  type ComponentInternalInstance,
  getCurrentInstance,
  inject,
  provide,
  type Ref,
  ref
} from "vue";
import type {
  RestResult,
  TimeProperties,
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody
} from "@/types/apis";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";
import {useSocketSubscriptions} from "@/composables";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {HOME_CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY} from "@/constants/systemConstant.ts";

export interface UseChatCallModelParams {
  closeTimerValue: Ref<TimeProperties>;
}

export interface ChatCallModelProps {
  title:string
  loading:boolean
}

export interface ChatCallModelInnerProps extends ChatCallModelProps{
  open: boolean
  closeTimerValue?:number
}

export interface ChatCallModelContext {
  model:ChatCallModelProps,
  localStream?:MediaStream,
  userChatCall?:UserChatCallResponseBody
}

export interface ChatCallModelExpose {
  context:ChatCallModelContext,
  openChatCallModel:(
    title:string,
    stream:MediaStream,
    _userChatCall:UserChatCallResponseBody
  ) => void,
  handleCancel:() => void,
}

export function provideChatCllExpose(config:UseChatCallModelParams) {
  const {on} = useSocketSubscriptions()
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const context = ref<ChatCallModelContext>({
    model:{
      loading: false,
      open:false,
      title:' '
    } as ChatCallModelInnerProps
  })

  async function openChatCallModel(
    title:string,
    stream:MediaStream,
    _userChatCall:UserChatCallResponseBody
  ) {
    const model = context.value.model as ChatCallModelInnerProps
    model.open = true;
    model.title = title;

    context.value.userChatCall = _userChatCall;
    context.value.localStream = stream
  }

  function stopLocalStream() {
    context.value.localStream?.getTracks().forEach((track) => track.stop())
    context.value.localStream = undefined
  }

  async function handleCancel() {
    const model = context.value.model as ChatCallModelInnerProps
    try {
      model.loading = true
      if (context.value.userChatCall && getEnumValue(context.value.userChatCall.status) !== 30) {
        await ChatCallService.completed(Number(context.value.userChatCall.id))
      }
      model.open = false
      stopLocalStream()
    } finally {
      model.loading = false
    }
  }

  async function onChatCallComplete(result:RestResult<UserChatCallEntity>){
    if (!result.data) {
      return
    }
    if (!context.value.userChatCall) {
      return
    }

    context.value.userChatCall = {...context.value.userChatCall, ...result.data}
    const model = context.value.model as ChatCallModelInnerProps
    model.closeTimerValue = globalProperties.$dayjs().add(config.closeTimerValue.value.value, config.closeTimerValue.value.unit).valueOf()
  }

  function onChatCallConfirm(result:RestResult<UserChatCallParticipantEntity>){
    if (!result.data) {
      return
    }
    if (!context.value.userChatCall) {
      return
    }
    const participant = result.data
    const index = context.value.userChatCall.participants.findIndex(p => participant.id === p.id)
    if (index < 0) {
      return
    }
    context.value.userChatCall.participants[index] = participant
  }

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => onChatCallConfirm(parseSocketRestPayload<UserChatCallParticipantEntity>(payload))
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_COMPLETED,
    (payload) => onChatCallComplete(parseSocketRestPayload<UserChatCallEntity>(payload))
  )

  const exportContext:ChatCallModelExpose = {
    context:context.value,
    handleCancel:handleCancel,
    openChatCallModel:openChatCallModel
  }

  provide(HOME_CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY, exportContext)

  return exportContext
}

export function useChatCallModelExpose(): ChatCallModelExpose {
  const ctx = inject<ChatCallModelExpose>(HOME_CHAT_CALL_MODEL_EXPOSE_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatCallModelContext() 必须在 provideChatContext() 的组件子树内调用')
  }
  return ctx
}
