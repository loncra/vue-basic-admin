import {getEnumValue} from "@/utils/commonUtils.ts";
import type {NameValueEnumMetadata, UserChatCallEntity, UserChatRoomEntity} from "@/types/apis";
import {createIcon} from "@/utils/resourceUtils.ts";
import {VIDEO_CHAT_CONSTRAINTS} from "@/constants/messageConstant.ts";


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
  if (getEnumValue(callEntity.type) === 10) {
    return VIDEO_CHAT_CONSTRAINTS.PREVATE;
  } else {
    return VIDEO_CHAT_CONSTRAINTS.GROUP;
  }
}
/**
 * 
 * @param callEntity 
 * @returns 
 */
export function getMediaStreamConstraintsByRoom(room:UserChatRoomEntity) {
  if (getEnumValue(room.type) === 20) {
    return VIDEO_CHAT_CONSTRAINTS.PREVATE;
  } else {
    return VIDEO_CHAT_CONSTRAINTS.GROUP;
  }
}
