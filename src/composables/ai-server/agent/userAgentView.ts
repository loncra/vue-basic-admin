import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps,
  AgentSseMessageContent,
  AgentTokenUsageContent,
  BlockDeltaContentMetadata,
  ChatBubbleItem,
} from '@/types/composables'
import type {
  AgentMessageEntity,
  IdValueMetadata,
  RestResult,
  StreamAgentMessageEntity
} from '@/types/apis'
import {AgentService} from '@/apis'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {nextTick, ref} from 'vue'
import type LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import type LBubbleList from '@/components/basic/chat/BubbleList.vue'
import useApp from 'antdv-next/dist/app/useApp'
import {DEFAULT_BUBBLE_LIST_ROLE, useAgentChatContext} from '@/composables'
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE, CHAT_BUBBLE_TYPE} from '@/constants'
import {addBubbleListMessage, getEnumName, getEnumValue} from '@/utils'
import type {RoleType} from "@antdv-next/x/dist/bubble/interface";

/** Agent 气泡 role：ai 项按状态动态挂 loading */
export function createAgentBubbleListRole() {
  const baseAi = DEFAULT_BUBBLE_LIST_ROLE.ai
  return {
    ...DEFAULT_BUBBLE_LIST_ROLE,
    ai: (data: ChatBubbleItem) => {
      const isEmpty = !data.content || (data.content as AgentSseMessageContent[]).length <= 0
      return {
        ...(typeof baseAi === 'function' ? baseAi(data) : baseAi),
        variant:"borderless",
        shape:"round",
        loading: isEmpty,
      }
    } ,
  } as RoleType
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
      } else {
        const conversationId = Number(conversationActive.value.id)
        const userMessage: AgentMessageEntity = {
          id: result.data.userMessageId,
          content: value.content,
          status: AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.USER,
          agentConversationId: conversationId,
        }
        const assistantMessage: AgentMessageEntity = {
          id: result.data.assistantMessageId,
          content: [],
          status: AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.AI,
          agentConversationId: conversationId,
          parentId: result.data.userMessageId,
        } as AgentMessageEntity

        addBubbleListMessage(userMessage, CHAT_BUBBLE_TYPE.USER, conversationActive.value.dataSource.elements, true)
        addBubbleListMessage(assistantMessage, CHAT_BUBBLE_TYPE.AI, conversationActive.value.dataSource.elements, true)
        stream.connect(result.data.assistantMessageId)
        await nextTick()
      }

      bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      conversationActive.value.loading = false
    }
  }

  function countTokenUsage(item:ChatBubbleItem, field?:'inputTokens' | 'outputTokens' | 'cachedTokens') {
    const message = item.data as AgentMessageEntity
    const contents = ((message?.metadata?.tokenUsage || []) as AgentTokenUsageContent[])
    if (field) {
      return contents.reduce((acc:number, cur) => acc + cur[field], 0)
    } else {
      return contents.reduce((acc:number, cur) => acc + cur.inputTokens + cur.outputTokens, 0)
    }
  }
  function calcConversationCacheHitRate(item:ChatBubbleItem): number {
    let totalInput = 0, totalCached = 0
    totalInput += countTokenUsage(item, 'inputTokens')
    totalCached += countTokenUsage(item, 'cachedTokens')
    const denominator = totalInput + totalCached
    if (denominator === 0) {
      return 0
    }
    return Math.round((totalCached / denominator) * 100)
  }

  function eachTokenUsage(item:ChatBubbleItem, field:'inputTokens' | 'outputTokens' | 'cachedTokens'):IdValueMetadata<string, number>[] {
    const message = item.data as AgentMessageEntity
    const contents = ((message?.metadata?.tokenUsage || []) as AgentTokenUsageContent[])
    return contents.map(s => ({id:getEnumName(s.usageType), value:s[field]}))
  }

  async function copyText(item:StreamAgentMessageEntity) {
    try {
      const text = item.content
        .filter(s => getEnumValue(s.type) === AGENT_CONTENT_TYPE.ANSWER)
        .map(s => (s as BlockDeltaContentMetadata).value)
        .at(-1)
      await navigator.clipboard.writeText(text || "");
      item.copy = true;
    } catch {
      // 复制失败处理
    }
  }

  /*function onResume(body:AgentChatBasicResponseBody) {
    stream.connect(body.assistantMessageId)
  }*/

  return {
    bubbleListRef,
    senderRef,
    calcConversationCacheHitRate,
    copyText,
    eachTokenUsage,
    countTokenUsage,
    conversationActive,
    principalStore,
    loader,
    onSenderSubmit,
  }
}
