import {useChatCallModalExpose, useSocketSubscriptions} from "@/composables";
import {inject, markRaw, nextTick, provide, ref, watch,} from "vue";
import {getEnumValue, getMediaStreamConstraintsByCall} from "@/utils";
import type {RestResult, UserChatCallParticipantEntity} from "@/types/apis";
import {readVideoMetrics, readVideoMetricsFromElement,} from "@/utils/chatCallUtils.ts";
import {
  CHAT_CALL_MEDIA_PROVIDE_KEY,
  CHAT_CALL_PRIVATE_ROLE_TYPE,
  CHAT_CALL_TYPE,
  SOCKET_EVENT_TYPE,
  USER_CHAT_CALL_PARTICIPANT_STATUS,
  USER_CHAT_PARTICIPANT_TYPE,
} from "@/constants";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {Participant, Room} from "livekit-client";
import {
  type AudioCaptureOptions,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type LocalVideoTrack,
  RoomEvent,
  Track,
  type VideoCaptureOptions,
} from "livekit-client";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";
import type {
  CallMediaState,
  ChatCallMediaExpose,
  ChatCallPrivateRoleType,
  VideoMetrics
} from "@/types/composables";

export function provideChatCallMedia(): ChatCallMediaExpose {
  const {on} = useSocketSubscriptions()
  const chatCallExpose = useChatCallModalExpose()
  const principalStore = usePrincipalStore()

  const localParticipantVideoRef = ref<HTMLVideoElement>()
  const remoteParticipantVideoRef = ref<HTMLVideoElement>()
  const streamMetrics = ref<{local?: VideoMetrics; remote?: VideoMetrics}>({})

  const mediaOptions = ref<CallMediaState>({
    microphoneEnabled: true,
    cameraEnabled: true,
  })

  const remoteMediaState = ref<CallMediaState>({
    microphoneEnabled: true,
    cameraEnabled: true,
  })

  function refreshStreamMetrics(role: ChatCallPrivateRoleType) {
    const el = role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL
      ? localParticipantVideoRef.value
      : remoteParticipantVideoRef.value
    const metrics = readVideoMetricsFromElement(el)
    if (!metrics) {
      return
    }
    streamMetrics.value = {...streamMetrics.value, [role]: metrics}
  }

  function bindVideoMetrics(el: HTMLVideoElement | undefined, role: ChatCallPrivateRoleType) {
    if (!el) {
      return
    }
    const onMetadata = () => refreshStreamMetrics(role)
    el.addEventListener('loadedmetadata', onMetadata)
    onMetadata()
  }

  function applyLocalVideoMetricsFromTrack(videoTrack: LocalVideoTrack) {
    const settings = videoTrack.mediaStreamTrack?.getSettings()
    if (!settings?.width || !settings?.height) {
      return
    }
    const metrics = readVideoMetrics(settings.width, settings.height)
    if (!metrics) {
      return
    }
    streamMetrics.value = {...streamMetrics.value, local: metrics}
  }

  async function applyLocalVideoToView(videoTrack: LocalVideoTrack) {
    await nextTick()
    if (!localParticipantVideoRef.value) {
      return
    }
    videoTrack.attach(localParticipantVideoRef.value)
    bindVideoMetrics(localParticipantVideoRef.value, CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)
    applyLocalVideoMetricsFromTrack(videoTrack)
  }

  async function setupLocalPreviewVideo(publish = false) {
    const call = chatCallExpose.context.userChatCall
    if (!call) {
      return
    }
    const constraints = getMediaStreamConstraintsByCall(call)
    const videoTrack = await createLocalVideoTrack(constraints.video as VideoCaptureOptions)
    chatCallExpose.context.previewTrack = {
      ...chatCallExpose.context.previewTrack,
      video: markRaw(videoTrack),
    }
    await applyLocalVideoToView(videoTrack)
    if (publish && chatCallExpose.context.room) {
      await chatCallExpose.context.room.localParticipant.publishTrack(videoTrack, {
        source: Track.Source.Camera,
      })
    }
  }

  async function startLocalPreview() {
    const call = chatCallExpose.context.userChatCall
    if (!call) {
      return
    }

    const isVideoCall = getEnumValue(call.type) === CHAT_CALL_TYPE.VIDEO
    mediaOptions.value.cameraEnabled = isVideoCall

    const constraints = getMediaStreamConstraintsByCall(call)
    const previewAudioTrack = await createLocalAudioTrack(
      constraints.audio as AudioCaptureOptions,
    )
    chatCallExpose.context.previewTrack = {
      audio: markRaw(previewAudioTrack),
    }

    if (!isVideoCall) {
      return
    }

    await setupLocalPreviewVideo()
  }

  async function reattachVideoElements() {
    await nextTick()
    const previewVideo = chatCallExpose.context.previewTrack?.video
    if (previewVideo && localParticipantVideoRef.value) {
      previewVideo.attach(localParticipantVideoRef.value)
      bindVideoMetrics(localParticipantVideoRef.value, CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)
    }
    const remote = getRemoteParticipant()
    const remoteVideoPub = remote?.getTrackPublication(Track.Source.Camera)
    if (remoteVideoPub?.track && remoteParticipantVideoRef.value) {
      remoteVideoPub.track.attach(remoteParticipantVideoRef.value)
      bindVideoMetrics(remoteParticipantVideoRef.value, CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)
    }
  }

  async function toggleMicrophone() {
    mediaOptions.value.microphoneEnabled = !mediaOptions.value.microphoneEnabled
    const audio = chatCallExpose.context.previewTrack?.audio
    if (audio) {
      mediaOptions.value.microphoneEnabled ? await audio.unmute() : await audio.mute()
      return
    }
    await chatCallExpose.context.room?.localParticipant.setMicrophoneEnabled(
      mediaOptions.value.microphoneEnabled,
    )
  }

  async function ensureLocalVideoAttached() {
    const video = chatCallExpose.context.previewTrack?.video
    if (!video) {
      return
    }
    await applyLocalVideoToView(video)
  }

  async function toggleCamera() {
    const enabling = !mediaOptions.value.cameraEnabled
    mediaOptions.value.cameraEnabled = enabling

    const video = chatCallExpose.context.previewTrack?.video
    if (enabling) {
      if (!video) {
        await setupLocalPreviewVideo(true)
        return
      }
      await video.unmute()
      await ensureLocalVideoAttached()
      return
    }

    if (video) {
      await video.mute()
      return
    }
    await chatCallExpose.context.room?.localParticipant.setCameraEnabled(false)
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
    if (!room) {
      return undefined
    }
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

  async function onChatCallConfirm(result: RestResult<UserChatCallParticipantEntity>) {
    if (!result.data || !chatCallExpose.context.room || !chatCallExpose.context.userChatCall) {
      return
    }
    const participant = result.data
    chatCallExpose.updateParticipant(participant)
    if (getEnumValue(participant.status) !== USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE) {
      return
    }

    const userCall = chatCallExpose.context.userChatCall
    const room = chatCallExpose.context.room
    if (participant.principal === principalStore.state.name) {
      await room.connect(String(participant.metadata.liveKit.id), participant.metadata.liveKit.value)
      bindRemoteMediaEvents(room)
    } else {
      const caller = userCall.participants.find(s => getEnumValue(s.type) === USER_CHAT_PARTICIPANT_TYPE.CALLER)
      if (caller && getEnumValue(caller.status) === USER_CHAT_CALL_PARTICIPANT_STATUS.INITIATING) {
        await ChatCallService.accept(Number(chatCallExpose.context.userChatCall.id))
        return
      }
    }

    if ((userCall.participants || []).every(s => getEnumValue(s.status) === USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE)) {
      await nextTick()
      room.on(RoomEvent.TrackSubscribed, (track, _publication, trackParticipant) => {
        if (trackParticipant.isLocal) {
          return
        }

        if (track.kind === Track.Kind.Video) {
          track.attach(remoteParticipantVideoRef.value!)
          bindVideoMetrics(remoteParticipantVideoRef.value, CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)
        } else if (track.kind === Track.Kind.Audio) {
          track.attach()
        }
        syncRemoteMediaState(trackParticipant)
      })

      const previewTrack = chatCallExpose.context.previewTrack
      if (previewTrack?.video) {
        await room.localParticipant.publishTrack(previewTrack.video, {
          source: Track.Source.Camera,
        })
      } else {
        await room.localParticipant.setCameraEnabled(false)
      }

      if (previewTrack?.audio) {
        await room.localParticipant.publishTrack(previewTrack.audio, {
          source: Track.Source.Microphone,
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

  watch(
    () => [mediaOptions.value.cameraEnabled, remoteMediaState.value.cameraEnabled],
    async () => {
      await nextTick()
      await reattachVideoElements()
    },
  )

  watch(
    () => chatCallExpose.context.userChatCall?.id,
    (id) => {
      if (!id) {
        return
      }
      mediaOptions.value = {
        microphoneEnabled: true,
        cameraEnabled: true,
      }
      remoteMediaState.value = {
        microphoneEnabled: true,
        cameraEnabled: true,
      }
      streamMetrics.value = {}
    },
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => onChatCallConfirm(parseSocketRestPayload<UserChatCallParticipantEntity>(payload)),
  )

  const expose: ChatCallMediaExpose = {
    localParticipantVideoRef,
    remoteParticipantVideoRef,
    streamMetrics,
    mediaOptions,
    remoteMediaState,
    startLocalPreview,
    reattachVideoElements,
    toggleMicrophone,
    toggleCamera,
    bindVideoMetrics,
    refreshStreamMetrics,
  }

  provide(CHAT_CALL_MEDIA_PROVIDE_KEY, expose)
  return expose
}

export function useChatCallMediaExpose(): ChatCallMediaExpose {
  const ctx = inject<ChatCallMediaExpose>(CHAT_CALL_MEDIA_PROVIDE_KEY)
  if (!ctx) {
    throw new Error('useChatCallMediaExpose() 必须在 provideChatCallMedia() 的组件子树内调用')
  }
  return ctx
}
