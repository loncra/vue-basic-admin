import {getEnumValue} from "@/utils/commonUtils.ts";
import type {NameValueEnumMetadata, UserChatCallEntity, UserChatRoomEntity} from "@/types/apis";
import {createIcon} from "@/utils/resourceUtils.ts";
import {MESSAGE_GROUP, VIDEO_CHAT_CONSTRAINTS} from "@/constants/messageConstant.ts";
import {h, ref, type Ref} from "vue";
import {Button, Space} from "antdv-next";
import i18n from '@/i18n'
import {useAppNotification} from "@/composables/useAppNotification.ts";


export function getParticipantBadgeStatus(status:NameValueEnumMetadata<number> | number) {
  const value = getEnumValue(status)
  if ([50,60,61,62,63].includes(value)) {
    return "error"
  } else if ([10, 20, 30].includes(value)) {
    return "processing"
  } else if ([40].includes(value)) {
    return "success"
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

export function getMediaStreamConstraintsByCall(callEntity:UserChatCallEntity) {
  if (getEnumValue(callEntity.type) === 10) {
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



export function createChatCallAction(
  userChatCallId: number,
  onAccept: (key: string, id: number, loading: Ref<boolean>) => void,
  onRejected: (key: string, id: number, loading: Ref<boolean>) => void
) {
  const loading = ref<boolean>(false)
  const key = MESSAGE_GROUP.USER_CHAT_CALL + "_" + String(userChatCallId)
  const {destroy} = useAppNotification()
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
          icon: createIcon('loncra-message-square-off', 'align'),
          default: () => i18n.global.t('common.ignore')
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
          icon: createIcon('loncra-message-square-check', 'align'),
          default: () => i18n.global.t('common.accept')
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
          icon: createIcon('loncra-message-square-x', 'align'),
          default: () => i18n.global.t('common.rejected')
        },
      )
    ])
}
