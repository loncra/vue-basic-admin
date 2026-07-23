import {getEnumValue} from "@/utils/commonUtils.ts";
import type {NameValueEnumMetadata, UserChatCallEntity, UserChatRoomEntity} from "@/types/apis";
import {createIcon} from "@/utils/resourceUtils.ts";
import {
  CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE,
  CHAT_CALL_SCENE,
  PIP_MAX_WIDTH_PX,
  PIP_WIDTH_RATIO,
  VIDEO_CHAT_CONSTRAINTS
} from "@/constants";
import type {
  CallLayoutSpec,
  CallPanelStyle,
  ChatCallPrivateSplitScreenType,
  LayoutConstraints,
  VideoMetrics
} from "@/types/composables";

export function getParticipantBadgeStatus(status:NameValueEnumMetadata<number> | number) {
  const value = getEnumValue(status)
  if ([50,60,61,63].includes(value)) {
    return "error"
  } else if ([10, 20, 30].includes(value)) {
    return "processing"
  } else if ([40].includes(value)) {
    return "success"
  } else if ([62].includes(value)) {
    return "default"
  } else {
    return "warning"
  }
}

export function getCallIcon(type:NameValueEnumMetadata<number> | number, vnode?:Record<string, unknown>) {
  let result: string;
  if (getEnumValue(type) === 10) {
    result = "loncra-video"
  } else {
    result = "loncra-mic"
  }
  if (vnode) {
    return createIcon(result, String(vnode.classes), Boolean(vnode.spin), Number(vnode.rotate))
  } else {
    return result;
  }
}

/**
 *
 * @param callEntity
 * @returns
 */
export function getMediaStreamConstraintsByCall(callEntity:UserChatCallEntity) {
  if (getEnumValue(callEntity.scene) === CHAT_CALL_SCENE.PRIVATE) {
    return VIDEO_CHAT_CONSTRAINTS.PREVATE;
  } else {
    return VIDEO_CHAT_CONSTRAINTS.GROUP;
  }
}


export function getMediaStreamConstraintsByRoom(room:UserChatRoomEntity) {
  if (getEnumValue(room.type) === 20) {
    return VIDEO_CHAT_CONSTRAINTS.PREVATE;
  } else {
    return VIDEO_CHAT_CONSTRAINTS.GROUP;
  }
}

export function readVideoMetrics(width: number, height: number): VideoMetrics | undefined {
  if (!width || !height) {
    return undefined
  }
  return {width, height, aspect: width / height}
}

export function readVideoMetricsFromElement(el: HTMLVideoElement | undefined): VideoMetrics | undefined {
  if (!el?.videoWidth || !el.videoHeight) {
    return undefined
  }
  return readVideoMetrics(el.videoWidth, el.videoHeight)
}

/** 在 maxW x maxH 内等比缩放，不裁剪 */
export function fitVideoContain(video: VideoMetrics, maxW: number, maxH: number) {
  const scale = Math.min(maxW / video.width, maxH / video.height)
  return {
    width: Math.round(video.width * scale),
    height: Math.round(video.height * scale),
  }
}

function toPanelStyle(width: number, height: number): CallPanelStyle {
  return {width: `${width}px`, height: `${height}px`}
}

/** 根据是否全屏与视口大小得到布局约束 */
export function getCallLayoutConstraints(fullscreen: boolean): LayoutConstraints {
  if (typeof window === 'undefined') {
    return {maxWidth: 960, maxHeight: 540}
  }
  if (fullscreen) {
    return {
      maxWidth: window.innerWidth,
      maxHeight: window.innerHeight,
    }
  }
  return {
    maxWidth: Math.min(window.innerWidth * 0.92, 960),
    maxHeight: Math.min(window.innerHeight * 0.72, 540),
  }
}

/** 若当前处于浏览器原生全屏，则退出 */
export async function exitDocumentFullscreenIfNeeded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    await document.exitFullscreen()
  }
}

function layoutPrivateLeftRight(
  local: VideoMetrics,
  remote: VideoMetrics,
  constraints: LayoutConstraints,
): CallLayoutSpec {
  const panelMaxW = constraints.maxWidth / 2
  const localBox = fitVideoContain(local, panelMaxW, constraints.maxHeight)
  const remoteBox = fitVideoContain(remote, panelMaxW, constraints.maxHeight)
  const panelHeight = Math.max(localBox.height, remoteBox.height)
  const modalWidth = Math.round(panelMaxW * 2)
  return {
    modalWidth,
    modalHeight: panelHeight,
    local: toPanelStyle(panelMaxW, panelHeight),
    remote: toPanelStyle(panelMaxW, panelHeight),
  }
}

/**
 * 私聊 1v1 通话布局：默认大窗+PIP 或左右分屏。
 * targetFullWindow 为 true 时远端为大窗；false 时本地为大窗。
 */
export function computePrivateCallLayout(
  mode: ChatCallPrivateSplitScreenType,
  metrics: {local: VideoMetrics; remote: VideoMetrics},
  constraints: LayoutConstraints,
  targetFullWindow: boolean,
): CallLayoutSpec {
  const {local, remote} = metrics

  if (mode === CHAT_CALL_PRIVATE_SPLIT_SCREEN_TYPE.LEFT_RIGHT) {
    return layoutPrivateLeftRight(local, remote, constraints)
  }

  const main = targetFullWindow ? remote : local
  const pip = targetFullWindow ? local : remote
  const mainBox = fitVideoContain(main, constraints.maxWidth, constraints.maxHeight)
  const pipW = Math.min(mainBox.width * PIP_WIDTH_RATIO, PIP_MAX_WIDTH_PX)
  const pipH = Math.round(pipW / pip.aspect)

  if (targetFullWindow) {
    return {
      modalWidth: mainBox.width,
      modalHeight: mainBox.height,
      local: toPanelStyle(pipW, pipH),
      remote: toPanelStyle(mainBox.width, mainBox.height),
    }
  }
  return {
    modalWidth: mainBox.width,
    modalHeight: mainBox.height,
    local: toPanelStyle(mainBox.width, mainBox.height),
    remote: toPanelStyle(pipW, pipH),
  }
}
