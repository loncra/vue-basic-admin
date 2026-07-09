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
import {CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
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
import type { Room, Participant } from "livekit-client";
import type { ChatCallPrivateSplitScreenType } from "@/types/composables/chat";


export interface TargetParticipant extends UserChatCallParticipantEntity {
  badgeStatus:string
}

export function usePrivateChatCallLayout() {
  const {on} = useSocketSubscriptions()
  const chatCallExpose = useChatCallModalExpose();
  const localParticipantVideoRef = ref<HTMLVideoElement>()
  const remoteParticipantVideoRef = ref<HTMLVideoElement>()
  const options = ref<{
    targetFullWindow:boolean
    microphoneEnabled:boolean
    cameraEnabled:boolean
    splitScreenType:ChatCallPrivateSplitScreenType
  }>({
    targetFullWindow:true,
    microphoneEnabled:true,
    cameraEnabled:true,
    splitScreenType:CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT
  })

  // 远端媒体状态（用于 UI）
  const remoteMediaState = ref({
    microphoneEnabled: true,
    cameraEnabled: true,
  })

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
    if (!options.value.targetFullWindow) {
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
    options.value.targetFullWindow = !options.value.targetFullWindow
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
      bindRemoteMediaEvents(room)
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
        syncRemoteMediaState(participant)
      })

      const previewTrack = chatCallExpose.context.previewTrack
      if (previewTrack && previewTrack.video) {
        await room.localParticipant.publishTrack(previewTrack.video,{
          source:Track.Source.Camera
        })
      } else {
        await room.localParticipant.setCameraEnabled(true)
      }

      if (previewTrack && previewTrack?.audio) {
        await room.localParticipant.publishTrack(previewTrack.audio,{
          source:Track.Source.Microphone
        })
      } else {
        await room.localParticipant.setMicrophoneEnabled(true)
      }
      
      const remote = getRemoteParticipant()
      if (remote) {
        syncRemoteMediaState(remote)
      }

    }

  }

  async function toggleMicrophone() {
    options.value.microphoneEnabled = !options.value.microphoneEnabled
    const audio = chatCallExpose.context.previewTrack?.audio
    if (audio) {
      options.value.microphoneEnabled ? await audio.unmute() : await audio.mute()
      return
    }
    await chatCallExpose.context.room?.localParticipant.setMicrophoneEnabled(options.value.microphoneEnabled)
  }

  async function toggleCamera() {
    options.value.cameraEnabled = !options.value.cameraEnabled
    const video = chatCallExpose.context.previewTrack?.video
    if (video) {
      options.value.cameraEnabled? await video.unmute() : await video.mute()
      return
    }
    await chatCallExpose.context.room?.localParticipant.setCameraEnabled(options.value.cameraEnabled)
  }

  function syncRemoteMediaState(participant: Participant) {
    if (participant.isLocal) {
      return
    }
    remoteMediaState.value = {
      microphoneEnabled: participant.isMicrophoneEnabled,
      cameraEnabled: participant.isCameraEnabled,
    }
  }

  function getRemoteParticipant() {
    const room = chatCallExpose.context.room
    if (!room) return undefined
    return Array.from(room.remoteParticipants.values())[0]
  }

  function bindRemoteMediaEvents(room: Room) {
    const sync = (participant: Participant) => syncRemoteMediaState(participant)
    room.on(RoomEvent.TrackMuted, (_pub, participant) => sync(participant))
    room.on(RoomEvent.TrackUnmuted, (_pub, participant) => sync(participant))
    room.on(RoomEvent.TrackPublished, (_pub, participant) => sync(participant))
    room.on(RoomEvent.TrackUnpublished, (_pub, participant) => sync(participant))
    room.on(RoomEvent.ParticipantConnected, (participant) => sync(participant))
  }

  on(SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => onChatCallConfirm(parseSocketRestPayload<UserChatCallParticipantEntity>(payload))
  )

  return {
    mounted,
    localParticipantVideoRef,
    remoteParticipantVideoRef,
    remoteMediaState,
    chatCallExpose,
    options,
    targetParticipant,
    toggleMicrophone,
    toggleCamera,
    changeFullWindow,
    getLocalParticipantVideoStyle
  }
}
