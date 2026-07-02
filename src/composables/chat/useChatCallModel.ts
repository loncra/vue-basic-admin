import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
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

export interface UseChatCallModelParams {
  closeTimerValue: Ref<TimeProperties>;
}

export function useChatCallModel(config:UseChatCallModelParams) {
  const {on} = useSocketSubscriptions()
  const userChatCall = ref<UserChatCallResponseBody>()
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const chatCallModel = ref<{
    open: boolean
    title:string
    loading:boolean
    stream?:MediaStream
    closeTimerValue?:number
  }>({
    loading: false,
    open:false,
    title:' '
  })

  const videoRef = ref<HTMLVideoElement>()

  async function openChatCallModel(
    title:string,
    stream:MediaStream,
    _userChatCall:UserChatCallResponseBody
  ) {
    chatCallModel.value.open = true;
    chatCallModel.value.title = title;
    chatCallModel.value.stream = stream

    userChatCall.value = _userChatCall;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  }

  function stopLocalStream() {
    chatCallModel.value.stream?.getTracks().forEach((track) => track.stop())
    chatCallModel.value.stream = undefined
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
  }

  const privateChatParticipant = computed(() => (userChatCall.value?.participants || []).find(p => getEnumValue(p.type) !== 31))

  async function handleCancel() {
    try {
      chatCallModel.value.loading = true
      if (userChatCall.value && getEnumValue(userChatCall.value.status) !== 30) {
        await ChatCallService.completed(Number(userChatCall.value.id))
      }
      chatCallModel.value.open = false
      stopLocalStream()
    } finally {
      chatCallModel.value.loading = false
    }
  }

  async function onChatCallComplete(result:RestResult<UserChatCallEntity>){
    if (!result.data) {
      return
    }
    if (!userChatCall.value) {
      return
    }

    userChatCall.value = {...userChatCall.value, ...result.data}
    chatCallModel.value.closeTimerValue = globalProperties.$dayjs().add(config.closeTimerValue.value.value, config.closeTimerValue.value.unit).valueOf()
  }

  function onChatCallConfirm(result:RestResult<UserChatCallParticipantEntity>){
    if (!result.data) {
      return
    }
    if (!userChatCall.value) {
      return
    }
    const participant = result.data
    const index = userChatCall.value.participants.findIndex(p => participant.id === p.id)
    if (index < 0) {
      return
    }
    userChatCall.value.participants[index] = participant
  }

  const privateChatParticipantBadge = computed(() => {
    if (!privateChatParticipant.value) {
      return undefined
    }
    const status = getEnumValue(privateChatParticipant.value.status)
    if ([50,60,61,62,63].includes(status)) {
      return "error"
    } else if ([20, 30].includes(status)) {
      return "processing"
    } else if ([40].includes(status)) {
      return "success"
    } else {
      return "warning"
    }
  })

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => onChatCallConfirm(parseSocketRestPayload<UserChatCallParticipantEntity>(payload))
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_COMPLETED,
    (payload) => onChatCallComplete(parseSocketRestPayload<UserChatCallEntity>(payload))
  )

  return {
    videoRef,
    userChatCall,
    handleCancel,
    privateChatParticipant,
    privateChatParticipantBadge,
    chatCallModel,
    openChatCallModel
  }
}
