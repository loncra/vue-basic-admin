import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps,
  ChatContentBlock,
} from '@/types/composables'
import type {AgentMessageEntity} from '@/types/apis'
import type {RestResult} from '@loncra/client/commons'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {nextTick, ref} from 'vue'
import type LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import {appendMessages} from '@loncra/chat-core'
import {interruptAgent, sendAgentChat, type AgentBubbleList as LAgentBubbleList, type BubbleListExpose} from '@loncra/antdv-chat-pro'
import useApp from 'antdv-next/dist/app/useApp'
import {
  getConversationRuns,
  setConversationDraft,
  useAgentChatContext,
} from '@/composables'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import {AI_SERVER_AGENT_CHAT_STATUS} from '@loncra/client/ai'


export function useAgentView() {
  const {conversationActive, conversations, activateConversation, stream} = useAgentChatContext()
  const principalStore = usePrincipalStore()
  const bubbleListRef = ref<InstanceType<typeof LAgentBubbleList>>()

  function bubbleList(): BubbleListExpose | undefined {
    return bubbleListRef.value as BubbleListExpose | undefined
  }
  const senderRef = ref<InstanceType<typeof LAgentSender>>()

  const {message} = useApp()

  function persistSenderDraft(): Promise<void> {
    return senderRef.value?.flush() ?? Promise.resolve()
  }

  function clearPersistedDraft(): Promise<void> {
    return senderRef.value?.clearStored() ?? Promise.resolve()
  }

  function onAppliedSlots(slots: SlotConfigType[]): void {
    const id = conversationActive.value?.id
    if (id == null) {
      return
    }
    setConversationDraft(conversations.value, conversationActive, id, slots as ChatContentBlock[])
  }

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
      const result: RestResult<AgentChatResponseBody> = await sendAgentChat(form)
      if (!result.data?.conversation) {
        return
      }

      senderRef.value?.clear()
      // 发送成功再清 IDB：失败保留，刷新后还能重试。
      await clearPersistedDraft()
      setConversationDraft(
        conversations.value,
        conversationActive,
        conversationActive.value.id,
        [],
      )

      if (result.data.conversation.id !== conversationActive.value.id) {
        const newConversation = {
          editing: conversationActive.value.editing,
          ...result.data.conversation,
        }
        await activateConversation(newConversation)
      } else {
        const conversationId = Number(conversationActive.value.id)
        const userMessage: AgentMessageEntity = {
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          id: result.data.userMessageId,
          content: value.content,
          status: AI_SERVER_AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.USER,
          agentConversationId: conversationId
        }
        const assistantMessage: AgentMessageEntity = {
          id: result.data.assistantMessageId,
          content: [],
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          status: AI_SERVER_AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.AI,
          agentConversationId: conversationId,
          parentId: result.data.userMessageId,
        }

        appendMessages(userMessage, CHAT_BUBBLE_TYPE.USER, conversationActive.value.dataSource.elements, true)
        appendMessages(assistantMessage, CHAT_BUBBLE_TYPE.AI, conversationActive.value.dataSource.elements, true)
        stream.connect(result.data.assistantMessageId)
        await nextTick()
      }

      bubbleList()?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      conversationActive.value.loading = false
    }
  }

  async function onSenderCancel() {
    if (!conversationActive.value) {
      return
    }
    const runs = getConversationRuns(conversationActive.value)
    for (const run of runs) {
      await interruptAgent(Number(run.key))
    }
  }

  function getSenderSlotConfigValue(): ChatContentBlock[] {
    return (senderRef.value?.getSlotConfigValue() || []) as ChatContentBlock[]
  }

  return {
    bubbleListRef,
    senderRef,
    conversationActive,
    principalStore,
    stream,
    onSenderSubmit,
    onSenderCancel,
    getSenderSlotConfigValue,
    persistSenderDraft,
    onAppliedSlots,
  }
}
