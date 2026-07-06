import {useChatCallModalExpose, useSocketSubscriptions} from "@/composables";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  nextTick,
  ref
} from "vue";
import {getEnumValue, getMediaStreamConstraintsByCall, requireNonNullOrUndefined} from "@/utils";
import type {RestResult, UserChatCallParticipantEntity} from "@/types/apis";
import {getParticipantBadgeStatus} from "@/utils/chatCallUtils.ts";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {
  type AudioCaptureOptions,
  createLocalAudioTrack,
  createLocalVideoTrack,
  RoomEvent,
  Track,
  type VideoCaptureOptions
} from "livekit-client";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {AuthServerService} from "@/apis";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";

export interface TargetParticipant extends UserChatCallParticipantEntity {
  badgeStatus:string
}

export function usePrivateChatCallLayout() {
  const {on} = useSocketSubscriptions()
  const chatCallExpose = useChatCallModalExpose();
  const targetFullWindow = ref<boolean>(true)
  const localParticipantVideoRef = ref<HTMLVideoElement>()
  const remoteParticipantVideoRef = ref<HTMLVideoElement>()

  const principalStore = usePrincipalStore()

  const globalProperties =
    requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
      .globalProperties

  async function startLocalPreview() {
    const call = chatCallExpose.context.userChatCall
    if (!call) {
      return
    }
    await nextTick()
    if (!localParticipantVideoRef.value) {
      return
    }
    // 约束可沿用你项目里的 VIDEO_CHAT_CONSTRAINTS
    const previewVideoTrack = await createLocalVideoTrack(
      getMediaStreamConstraintsByCall(call).video as VideoCaptureOptions
    )
    const previewAudioTrack = await createLocalAudioTrack(
      getMediaStreamConstraintsByCall(call).audio as AudioCaptureOptions
    )
    chatCallExpose.context.previewTrack = {
      video: markRaw(previewVideoTrack),
      audio: markRaw(previewAudioTrack)
    }
    previewVideoTrack.attach(localParticipantVideoRef.value)
    const settings = previewVideoTrack?.mediaStreamTrack?.getSettings()
    const width = settings?.width
    if (typeof width === 'number' && width > 0) {
      chatCallExpose.context.modal.width = width / 1.5
    }
  }

  function getLocalParticipantVideoStyle() {
    if (!targetFullWindow.value) {
      return undefined
    }
    return chatCallExpose.context.modal.width ? {
      height: 'auto',
      width: (chatCallExpose.context.modal.width / 4) + "px"
    } : undefined
  }

  async function mounted() {
    if (!chatCallExpose.context.userChatCall) {
      return
    }

    const callEntity = chatCallExpose.context.userChatCall;
    const key = getEnumValue(callEntity.type) === 10 ? "chat.call.video.title" : "chat.call.video.title";

    if (targetParticipant.value) {
      const name = AuthServerService.getPrincipalNameByUserDetails(targetParticipant.value.metadata.details)
      chatCallExpose.context.modal.title = globalProperties.$t(key,{user:name})
    } else {
      chatCallExpose.context.modal.title = globalProperties.$t('common.unname')
    }
    await startLocalPreview();
  }

  const targetParticipant = computed(() => {
    if (!chatCallExpose.context.userChatCall) {
      return undefined
    }
    const result = (chatCallExpose.context?.userChatCall?.participants || [])
      .find(p => p.principal !== principalStore.state.name) as TargetParticipant
    result.badgeStatus = getParticipantBadgeStatus(result.status)
    return result;
  })

  function changeFullWindow() {
    targetFullWindow.value = !targetFullWindow.value

  }

  async function onChatCallConfirm(result:RestResult<UserChatCallParticipantEntity>){
    if (!result.data || !chatCallExpose.context.room || !chatCallExpose.context.userChatCall) {
      return
    }
    const participant = result.data
    chatCallExpose.updateParticipant(participant)
    if (getEnumValue(participant.status) !== 40) {
      return
    }

    const userCall = chatCallExpose.context.userChatCall
    const room = chatCallExpose.context.room
    if (participant.principal === principalStore.state.name) {
      await room.connect(String(participant.metadata.liveKit.id), participant.metadata.liveKit.value)
    } else {
      const caller = userCall.participants
        .find(s => getEnumValue(s.type) === 31)
      if (caller && getEnumValue(caller.status) === 10) {
        await ChatCallService.accept(Number(chatCallExpose.context.userChatCall.id))
        return
      }
    }

    if ((userCall.participants || []).every(s => getEnumValue(s.status) === 40)) {

      await nextTick()
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (participant.isLocal) {
          return
        }

        if (track.kind === Track.Kind.Video) {
          track.attach(remoteParticipantVideoRef.value!)
        } else if (track.kind === Track.Kind.Audio) {
          track.attach() // 或 attach 到专用 <audio> 元素
        }
      })

      const previewTrack = chatCallExpose.context.previewTrack
      if (previewTrack && previewTrack.video) {
        await room.localParticipant.publishTrack(previewTrack.video)
      } else {
        await room.localParticipant.setCameraEnabled(true)
      }

      if (previewTrack && previewTrack?.audio) {
        await room.localParticipant.publishTrack(previewTrack.audio)
      } else {
        await room.localParticipant.setMicrophoneEnabled(true)
      }
    }

  }

  on(SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => onChatCallConfirm(parseSocketRestPayload<UserChatCallParticipantEntity>(payload))
  )

  return {
    mounted,
    localParticipantVideoRef,
    remoteParticipantVideoRef,
    chatCallExpose,
    targetFullWindow,
    targetParticipant,
    changeFullWindow,
    getLocalParticipantVideoStyle
  }
}
