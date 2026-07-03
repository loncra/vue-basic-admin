import {useChatCallModelExpose} from "@/composables";
import {computed, ref} from "vue";
import {getEnumValue} from "@/utils";
import type {UserChatCallParticipantEntity} from "@/types/apis";
import {getParticipantBadgeStatus} from "@/utils/chatCallUtils.ts";

export interface CalleeParticipant extends UserChatCallParticipantEntity {
  badgeStatus:string
}

export function usePrivateChatCallLayout() {
  const chatCallExpose = useChatCallModelExpose();
  const calleeFullWindow = ref<boolean>(true)

  const calleeParticipant = computed(() => {
    if (!chatCallExpose.context.userChatCall) {
      return undefined
    }
    const result = (chatCallExpose.context?.userChatCall?.participants || [])
      .find(p => getEnumValue(p.type) !== 31) as CalleeParticipant
    result.badgeStatus = getParticipantBadgeStatus(result.status)
    return result;
  })

  function changeFullWindow() {
    calleeFullWindow.value = !calleeFullWindow.value
  }

  return {
    chatCallExpose,
    calleeFullWindow,
    calleeParticipant,
    changeFullWindow
  }
}
