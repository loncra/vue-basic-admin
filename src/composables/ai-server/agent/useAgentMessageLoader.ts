import type {Ref} from "vue";
import type {ActiveAgentConversationItem} from "@/types/composables";


export function useAgentMessageLoader() {

  function switchConversation(
    conversation: Ref<ActiveAgentConversationItem | undefined>,
    messageId?: number,
    reload: boolean = false,
  ) {
    if (!conversation.value) {
      return;
    }
  }
  return {
    switchConversation
  }
}
