import {useChatCallMediaExpose, useChatCallModalExpose} from "@/composables";
import type {CSSProperties} from "vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {
  computePrivateCallLayout,
  getCallLayoutConstraints,
  getParticipantBadgeStatus,
} from "@/utils/chatCallUtils.ts";
import {
  CHAT_CALL_MINI_SIZE,
  CHAT_CALL_PRIVATE_ROLE_TYPE,
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  CHAT_CALL_TYPE,
  CHAT_CALL_UI_MODE,
  PRIVATE_VIDEO_LAYOUT_METRICS,
} from "@/constants/messageConstant.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {AuthServerService} from "@/apis";
import type {ChatCallModalInnerProps} from "@/composables/chat/useChatCallModal.ts";
import type {ChatCallPrivateRoleType, ChatCallPrivateSplitScreenType,} from "@/types/composables";
import type {UserChatCallParticipantEntity} from "@/types/apis";

export interface TargetParticipant extends UserChatCallParticipantEntity {
  badgeStatus: string
}

export interface PrivateLayoutOptions {
  targetFullWindow: boolean
  splitScreenType: ChatCallPrivateSplitScreenType
}

const miniWindowClass =
  'absolute opacity-80 top-0 left-0 rounded-lg border border-border-secondary m-xs shadow-card bg-container cursor-pointer z-10'

export function usePrivateChatCallLayout() {
  const chatCallExpose = useChatCallModalExpose()
  const media = useChatCallMediaExpose()
  const principalStore = usePrincipalStore()
  const viewportTick = ref(0)

  const globalProperties =
    requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
      .globalProperties

  const options = ref<PrivateLayoutOptions>({
    targetFullWindow: true,
    splitScreenType: CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.DEFAULT,
  })

  const expandedLayoutSnapshot = ref<PrivateLayoutOptions | null>(null)

  const isLeftRightSplit = computed(
    () => options.value.splitScreenType === CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT,
  )

  const isNativeFullscreen = computed(() => {
    const modal = chatCallExpose.context.modal as ChatCallModalInnerProps
    return modal.fullscreen ?? false
  })

  const isCallMinimized = computed(() => {
    const modal = chatCallExpose.context.modal as ChatCallModalInnerProps
    return modal.uiMode === CHAT_CALL_UI_MODE.MINIMIZED
  })

  const layoutConstraints = computed(() => {
    viewportTick.value
    const modal = chatCallExpose.context.modal as ChatCallModalInnerProps
    return getCallLayoutConstraints(modal.fullscreen ?? false)
  })

  const layoutMetrics = computed(() => {
    const metrics = media.streamMetrics.value
    const local = metrics.local ?? PRIVATE_VIDEO_LAYOUT_METRICS
    return {
      local,
      remote: metrics.remote ?? local,
    }
  })

  const layoutSpec = computed(() =>
    computePrivateCallLayout(
      options.value.splitScreenType,
      layoutMetrics.value,
      layoutConstraints.value,
      options.value.targetFullWindow,
    ),
  )

  function syncModalLayoutFromSpec() {
    if (isNativeFullscreen.value || isCallMinimized.value) {
      return
    }
    const spec = layoutSpec.value
    chatCallExpose.context.modal.width = spec.modalWidth
    chatCallExpose.context.modal.height = spec.modalHeight
  }

  watch(layoutSpec, () => syncModalLayoutFromSpec(), {immediate: true})

  watch(isNativeFullscreen, (fullscreen) => {
    if (fullscreen) {
      viewportTick.value++
      return
    }
    syncModalLayoutFromSpec()
  })

  watch(
    () => media.streamMetrics.value,
    () => syncModalLayoutFromSpec(),
    {deep: true},
  )

  const contentStyle = computed(() => {
    if (isCallMinimized.value) {
      return {width: '100%', height: `${CHAT_CALL_MINI_SIZE.HEIGHT}px`}
    }
    if (isNativeFullscreen.value) {
      return {width: '100%', height: '100%'}
    }
    return {
      width: '100%',
      height: `${layoutSpec.value.modalHeight}px`,
    }
  })

  const rootClass = computed(() => {
    if (isCallMinimized.value) {
      return 'relative size-full bg-black cursor-pointer'
    }
    return isNativeFullscreen.value ? 'relative size-full bg-black' : 'relative size-full bg-layout'
  })

  function isPipRole(role: ChatCallPrivateRoleType): boolean {
    if (isLeftRightSplit.value) {
      return false
    }
    return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL
      ? options.value.targetFullWindow
      : !options.value.targetFullWindow
  }

  function getPanelShellStyle(role: ChatCallPrivateRoleType): CSSProperties {
    if (isCallMinimized.value) {
      if (role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL) {
        return {display: 'none'}
      }
      return {width: '100%', height: '100%'}
    }

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
      const panel = role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? spec.local : spec.remote
      return {width: panel.width, height: '100%'}
    }
    if (isPipRole(role)) {
      return role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL ? spec.local : spec.remote
    }
    return {width: '100%', height: `${spec.modalHeight}px`}
  }

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

  function getPlaceholderPanelClass(role: ChatCallPrivateRoleType): string {
    const shell = getPanelShellClass(role)
    if (isPipRole(role) && !isLeftRightSplit.value) {
      return shell
    }
    return `${shell} bg-container`
  }

  function getVideoElementClass(role: ChatCallPrivateRoleType): string {
    if (isCallMinimized.value) {
      return 'block size-full object-cover'
    }

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

    const callEntity = chatCallExpose.context.userChatCall
    const key = String(getEnumValue(callEntity.type)) === CHAT_CALL_TYPE.VIDEO
      ? 'chat.call.video.title'
      : 'chat.call.voice.title'

    if (targetParticipant.value) {
      const name = AuthServerService.getPrincipalNameByUserDetails(
        targetParticipant.value.metadata.details,
      )
      chatCallExpose.context.modal.title = globalProperties.$t(key, {user: name})
    } else {
      chatCallExpose.context.modal.title = globalProperties.$t('common.unname')
    }
    await media.startLocalPreview()
    syncModalLayoutFromSpec()
  }

  const targetParticipant = computed(() => {
    if (!chatCallExpose.context.userChatCall) {
      return undefined
    }
    const result = (chatCallExpose.context?.userChatCall?.participants || []).find(
      p => p.principal !== principalStore.state.name,
    ) as TargetParticipant
    result.badgeStatus = getParticipantBadgeStatus(result.status)
    return result
  })

  const remoteVideoConnected = computed(() =>
    targetParticipant.value ? getEnumValue(targetParticipant.value.status) === 40 : false,
  )

  const localParticipantDetails = computed(() => principalStore.state.details?.metadata)

  function showParticipantVideo(role: ChatCallPrivateRoleType): boolean {
    if (role === CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL) {
      return media.mediaOptions.value.cameraEnabled
    }
    if (!remoteVideoConnected.value) {
      return false
    }
    return media.remoteMediaState.value.cameraEnabled
  }

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

  watch(isLeftRightSplit, () => {
    void media.reattachVideoElements()
  })

  watch(isCallMinimized, async (minimized) => {
    if (minimized) {
      expandedLayoutSnapshot.value = {
        targetFullWindow: options.value.targetFullWindow,
        splitScreenType: options.value.splitScreenType,
      }
      options.value.targetFullWindow = true
      await nextTick()
      await media.reattachVideoElements()
      return
    }
    const snapshot = expandedLayoutSnapshot.value
    if (!snapshot) {
      return
    }
    options.value.targetFullWindow = snapshot.targetFullWindow
    options.value.splitScreenType = snapshot.splitScreenType
    expandedLayoutSnapshot.value = null
    await nextTick()
    syncModalLayoutFromSpec()
    await media.reattachVideoElements()
  })

  watch(
    () => (chatCallExpose.context.modal as ChatCallModalInnerProps).fullscreen,
    () => {
      viewportTick.value++
    },
  )

  function onViewportResize() {
    viewportTick.value++
  }

  onMounted(() => {
    window.addEventListener('resize', onViewportResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onViewportResize)
  })

  return {
    mounted,
    localParticipantVideoRef: media.localParticipantVideoRef,
    remoteParticipantVideoRef: media.remoteParticipantVideoRef,
    mediaOptions: media.mediaOptions,
    chatCallExpose,
    options,
    targetParticipant,
    localParticipantDetails,
    remoteVideoConnected,
    showParticipantVideo,
    isLeftRightSplit,
    isCallMinimized,
    isNativeFullscreen,
    layoutSpec,
    contentStyle,
    rootClass,
    toggleSplitScreen,
    changeFullWindow,
    getPanelShellClass,
    getPanelShellStyle,
    getPlaceholderPanelClass,
    getVideoElementClass,
  }
}
