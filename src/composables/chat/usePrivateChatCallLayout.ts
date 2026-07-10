import {useChatCallModalExpose, useSocketSubscriptions} from "@/composables";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import {getEnumValue, getMediaStreamConstraintsByCall, requireNonNullOrUndefined} from "@/utils";
import type {RestResult, UserChatCallParticipantEntity} from "@/types/apis";
import {
  computePrivateCallLayout,
  getCallLayoutConstraints,
  getParticipantBadgeStatus,
  readVideoMetrics,
  readVideoMetricsFromElement,
} from "@/utils/chatCallUtils.ts";
import {
  CHAT_CALL_PRIVATE_ROLE_TYPE,
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  SOCKET_EVENT_TYPE
} from "@/constants/messageConstant.ts";
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
import type {Participant, Room} from "livekit-client";
import type {CSSProperties} from "vue";
import type {ChatCallModalInnerProps} from "@/composables/chat/useChatCallModel.ts";
import type {
  ChatCallPrivateRoleType,
  ChatCallPrivateSplitScreenType,
  VideoMetrics
} from "@/types/composables";

export interface TargetParticipant extends UserChatCallParticipantEntity {
  badgeStatus:string
}

export interface MediaState  {
  microphoneEnabled:boolean
  cameraEnabled:boolean
}

export interface LocalMediaState extends MediaState {
  targetFullWindow:boolean
  splitScreenType: ChatCallPrivateSplitScreenType
}

const miniWindowClass =
  'absolute opacity-80 top-0 left-0 rounded-lg border border-border-secondary m-xs shadow-card bg-container cursor-pointer z-10'

export function usePrivateChatCallLayout() {
  const {on} = useSocketSubscriptions()
  const chatCallExpose = useChatCallModalExpose();
  const localParticipantVideoRef = ref<HTMLVideoElement>()
  const remoteParticipantVideoRef = ref<HTMLVideoElement>()
  const streamMetrics = ref<{local?: VideoMetrics; remote?: VideoMetrics}>({})
  const viewportTick = ref(0)

  const options = ref<LocalMediaState>({
    targetFullWindow:true,
    microphoneEnabled:true,
    cameraEnabled:true,
    splitScreenType:CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT,
  })

  const remoteMediaState = ref<MediaState>({
    microphoneEnabled: true,
    cameraEnabled: true,
  })

  const principalStore = usePrincipalStore()

  const globalProperties =
    requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
      .globalProperties

  const isLeftRightSplit = computed(() => options.value.splitScreenType === CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT)

  const isNativeFullscreen = computed(() => {
    const modal = chatCallExpose.context.modal as ChatCallModalInnerProps
    return modal.fullscreen ?? false
  })

  const layoutConstraints = computed(() => {
    viewportTick.value
    const modal = chatCallExpose.context.modal as ChatCallModalInnerProps
    return getCallLayoutConstraints(modal.fullscreen ?? false)
  })

  const layoutSpec = computed(() =>
    computePrivateCallLayout(
      options.value.splitScreenType,
      streamMetrics.value,
      layoutConstraints.value,
      options.value.targetFullWindow,
    ),
  )

  watch(layoutSpec, (spec) => {
    if (isNativeFullscreen.value) {
      return
    }
    chatCallExpose.context.modal.width = spec.modalWidth
    chatCallExpose.context.modal.height = spec.modalHeight
  }, {immediate: true})

  watch(isNativeFullscreen, (fullscreen) => {
    if (fullscreen) {
      viewportTick.value++
      return
    }
    const spec = layoutSpec.value
    chatCallExpose.context.modal.width = spec.modalWidth
    chatCallExpose.context.modal.height = spec.modalHeight
  })

  function refreshStreamMetrics(role: ChatCallPrivateRoleType) {
    const el = role === 'local' ? localParticipantVideoRef.value : remoteParticipantVideoRef.value
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

  async function startLocalPreview() {
    const call = chatCallExpose.context.userChatCall
    if (!call) {
      return
    }
    await nextTick()
    if (!localParticipantVideoRef.value) {
      return
    }
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
    bindVideoMetrics(localParticipantVideoRef.value, CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)

    const settings = previewVideoTrack.mediaStreamTrack?.getSettings()
    if (settings?.width && settings?.height) {
      const metrics = readVideoMetrics(settings.width, settings.height)
      if (metrics) {
        streamMetrics.value = {...streamMetrics.value, local: metrics}
      }
    }
  }

  const contentStyle = computed(() => {
    if (isNativeFullscreen.value) {
      return {width: '100%', height: '100%'}
    }
    return {
      minHeight: `${layoutSpec.value.modalHeight}px`,
      width: '100%',
    }
  })

  const rootClass = computed(() =>
    isNativeFullscreen.value ? 'relative size-full bg-black' : 'relative size-full bg-layout',
  )

  function isPipRole(role: ChatCallPrivateRoleType): boolean {
    if (isLeftRightSplit.value) {
      return false
    }
    return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? options.value.targetFullWindow : !options.value.targetFullWindow
  }

  function getPanelShellStyle(role: ChatCallPrivateRoleType): CSSProperties {
    if (isNativeFullscreen.value) {
      if (isLeftRightSplit.value) {
        return {flex: '1 1 0', width: '0', height: '100%'}
      }
      if (isPipRole(role)) {
        const spec = layoutSpec.value
        return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? spec.local : spec.remote
      }
      return {width: '100%', height: '100%'}
    }

    const spec = layoutSpec.value
    if (isLeftRightSplit.value) {
      return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? spec.local : spec.remote
    }
    if (isPipRole(role)) {
      return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? spec.local : spec.remote
    }
    return {width: '100%', height: `${spec.modalHeight}px`}
  }

  /** 面板容器：尺寸与定位，适用于 a-flex 占位与 video 外层，不含 block/object-* */
  function getPanelShellClass(role: ChatCallPrivateRoleType): string {
    if (isNativeFullscreen.value) {
      if (isLeftRightSplit.value) {
        return 'flex-1 min-w-0 h-full'
      }
      if (isPipRole(role)) {
        return miniWindowClass
      }
      return 'absolute inset-0 z-0'
    }

    if (isLeftRightSplit.value) {
      return 'shrink-0 min-w-0'
    }
    if (isPipRole(role)) {
      return miniWindowClass
    }
    return 'size-full min-h-0'
  }

  /** 未接听占位区：保留 flex 布局，附加背景 */
  function getPlaceholderPanelClass(role: ChatCallPrivateRoleType): string {
    const shell = getPanelShellClass(role)
    if (isPipRole(role) && !isLeftRightSplit.value) {
      return shell
    }
    return `${shell} bg-container`
  }

  /** 仅用于 video：display 与 object-fit */
  function getVideoElementClass(role: ChatCallPrivateRoleType): string {
    if (isNativeFullscreen.value) {
      if (isLeftRightSplit.value) {
        return 'block size-full min-w-0 object-cover'
      }
      if (isPipRole(role)) {
        return 'block size-full object-contain'
      }
      return 'block size-full object-cover'
    }

    if (isLeftRightSplit.value) {
      return 'block size-full object-contain shrink-0'
    }
    if (isPipRole(role)) {
      return 'block size-full object-contain'
    }
    return 'block size-full object-contain'
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

  const remoteVideoConnected = computed(() =>
    targetParticipant.value ? getEnumValue(targetParticipant.value.status) === 40 : false,
  )

  function changeFullWindow() {
    if (isLeftRightSplit.value) {
      return
    }
    options.value.targetFullWindow = !options.value.targetFullWindow
  }

  function toggleSplitScreen() {
    options.value.splitScreenType =
      options.value.splitScreenType === CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT
        ? CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT
        : CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT
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

  watch(isLeftRightSplit, () => {
    void reattachVideoElements()
  })

  watch(
    () => (chatCallExpose.context.modal as ChatCallModalInnerProps).fullscreen,
    () => {
      viewportTick.value++
    },
  )

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
      options.value.cameraEnabled ? await video.unmute() : await video.mute()
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

  function onViewportResize() {
    viewportTick.value++
  }

  onMounted(() => {
    window.addEventListener('resize', onViewportResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onViewportResize)
  })

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
    remoteVideoConnected,
    isLeftRightSplit,
    isNativeFullscreen,
    layoutSpec,
    contentStyle,
    rootClass,
    toggleMicrophone,
    toggleCamera,
    toggleSplitScreen,
    changeFullWindow,
    getPanelShellClass,
    getPanelShellStyle,
    getPlaceholderPanelClass,
    getVideoElementClass,
  }
}
