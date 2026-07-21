import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps
} from "@/types/composables";
import type {RestResult} from "@/types/apis";
import {AgentService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {computed, ref} from "vue";
import type {BubbleItemType, BubbleListRef} from "@antdv-next/x/dist/bubble/interface";
import type LAgentSender from "@/components/ai-server/agent/AgentSender.vue";
import useApp from "antdv-next/dist/app/useApp";
import {useAgentChatContext} from "@/composables";
import {AGENT_CHAT_STATUS} from "@/constants";
import {getEnumValue} from "@/utils";

export function useAgentView() {

  const {conversationActive} = useAgentChatContext()
  const principalStore = usePrincipalStore()
  const bubbleListRef = ref<BubbleListRef>()
  const senderRef = ref<InstanceType<typeof LAgentSender>>()

  const {message} = useApp()

  async function onSenderSubmit(value:AgentSenderFormProps) {
    if (!conversationActive.value) {
      return
    }

    conversationActive.value.loading = true
    try {

      const form:AgentChatRequestBody = {
        ...value,
        agentConversationId:conversationActive.value.id
      }
      const result:RestResult<AgentChatResponseBody> = await AgentService.chat(form)
      if (result.data?.conversation) {
        AgentService.loadStream(Number(result.data?.conversation.id))
        /*agentChatContext.conversationActive = {
          ...result.data?.conversation,
          dataSource:DEFAULT_PAGE_RESULT_VALUE,
          editing:false
        }*/

        /*if (result.data?.userMessageId) {
          agentChatContext.conversationActive.dataSource?.elements.push({
            role:CHAT_BUBBLE_TYPE.USER,
            content: value.content
          })
        }*/
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      conversationActive.value.loading = false
    }
  }

  const conversationBubbleItemType = computed<BubbleItemType[]>(() => (conversationActive.value?.dataSource?.elements || []).map(e => ({
    key: String(e.id),
    role: getEnumValue<string>(e.role) as BubbleItemType["role"],
    content: e.content || [],
    loading: getEnumValue(e.status) === AGENT_CHAT_STATUS.RUNNING,
  })))

  return {
    bubbleListRef,
    senderRef,
    conversationActive,
    principalStore,
    conversationBubbleItemType,
    onSenderSubmit
  }
}
