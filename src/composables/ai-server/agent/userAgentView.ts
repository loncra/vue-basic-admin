import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps,
} from '@/types/composables'
import type {AgentMessageEntity, RestResult} from '@/types/apis'
import {AgentService} from '@/apis'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {nextTick, ref} from 'vue'
import type LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import type LBubbleList from '@/components/basic/chat/BubbleList.vue'
import useApp from 'antdv-next/dist/app/useApp'
import {useAgentChatContext} from '@/composables'
import {AGENT_CHAT_STATUS, CHAT_BUBBLE_TYPE} from '@/constants'
import {addBubbleListMessage} from '@/utils'

export function useAgentView() {
  const {conversationActive, activateConversation, loader, stream} = useAgentChatContext()
  const principalStore = usePrincipalStore()
  const bubbleListRef = ref<InstanceType<typeof LBubbleList>>()
  const senderRef = ref<InstanceType<typeof LAgentSender>>()

  const {message} = useApp()

  async function onSenderSubmit(value: AgentSenderFormProps) {
    if (!conversationActive.value) {
      return
    }

    conversationActive.value.loading = true
    try {
      const form: AgentChatRequestBody = {
        ...value,
        agentConversationId: conversationActive.value.id,
      }
      const result: RestResult<AgentChatResponseBody> = await AgentService.chat(form)
      if (!result.data?.conversation) {
        return
      }

      if (result.data.conversation.id !== conversationActive.value.id) {
        const newConversation = {
          editing: conversationActive.value.editing,
          ...result.data.conversation,
        }
        await activateConversation(newConversation)
      }

      const conversationId = Number(conversationActive.value.id)
      const userMessage: AgentMessageEntity = {
        id: result.data.userMessageId,
        content: value.content,
        status: AGENT_CHAT_STATUS.READY,
        role: CHAT_BUBBLE_TYPE.USER,
        agentConversationId: conversationId,
      }
      const assistantMessage: AgentMessageEntity = {
        id: result.data.assistantId,
        content: [],
        status: AGENT_CHAT_STATUS.RUNNING,
        role: CHAT_BUBBLE_TYPE.AI,
        agentConversationId: conversationId,
        parentId: result.data.userMessageId,
      } as AgentMessageEntity

      addBubbleListMessage(userMessage, CHAT_BUBBLE_TYPE.USER, conversationActive.value.dataSource.elements, true)
      addBubbleListMessage(assistantMessage, CHAT_BUBBLE_TYPE.AI, conversationActive.value.dataSource.elements, true)
      stream.connect(result.data.assistantId)
      await nextTick()
      bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      conversationActive.value.loading = false
    }
  }

  return {
    bubbleListRef,
    senderRef,
    conversationActive,
    principalStore,
    loader,
    onSenderSubmit,
  }
}
