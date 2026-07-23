import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps, ChatBubbleItem, ChatContentBlock,
} from '@/types/composables'
import type {AgentMessageEntity, RestResult} from '@/types/apis'
import {AgentService} from '@/apis'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {nextTick, ref} from 'vue'
import type LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import type LBubbleList from '@/components/basic/chat/BubbleList.vue'
import useApp from 'antdv-next/dist/app/useApp'
import {DEFAULT_BUBBLE_LIST_ROLE, useAgentChatContext} from '@/composables'
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE, CHAT_BUBBLE_TYPE} from '@/constants'
import {addBubbleListMessage, getEnumValue} from '@/utils'
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";


function normalizeBlocks(
  content: ChatBubbleItem['content'],
): ChatContentBlock[] {
  if (!content) {
    return []
  }
  if (typeof content === 'string') {
    return content
      ? [{type: AGENT_CONTENT_TYPE.ANSWER, id: 'answer', value: content}]
      : []
  }
  return Array.isArray(content) ? content : [content]
}

/**
 * 助手气泡是否应展示 ax-bubble loading：RUNNING 且尚无 think/tool/answer/error 可展示内容。
 * role 回调入参为 BubbleItemType；业务字段 data 在 ChatBubbleItem 上，运行时始终存在。
 */
export function isAgentAssistantBubbleLoading(item: BubbleItemType): boolean {
  if (item.role !== CHAT_BUBBLE_TYPE.AI) {
    return false
  }

  const bubble = item as ChatBubbleItem
  const status = Number(
    getEnumValue((bubble.data as AgentMessageEntity | undefined)?.status as number | undefined),
  )
  if (status !== AGENT_CHAT_STATUS.RUNNING) {
    return false
  }
  for (const block of normalizeBlocks(bubble.content)) {
    if (block.type === AGENT_CONTENT_TYPE.THINK || block.type === AGENT_CONTENT_TYPE.TOOL) {
      return false
    }
    if (block.type === AGENT_CONTENT_TYPE.ANSWER || block.type === AGENT_CONTENT_TYPE.ERROR) {
      const value = (block as {value?: string}).value
      if (value) {
        return false
      }
    }
  }
  return true
}

/** Agent 气泡 role：ai 项按状态动态挂 loading */
export function createAgentBubbleListRole() {
  const baseAi = DEFAULT_BUBBLE_LIST_ROLE.ai
  return {
    ...DEFAULT_BUBBLE_LIST_ROLE,
    ai: (data: BubbleItemType) => ({
      ...(typeof baseAi === 'function' ? baseAi(data) : baseAi),
      loading: isAgentAssistantBubbleLoading(data),
    }),
  }
}

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
