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
import {DEFAULT_BUBBLE_LIST_ROLE, getConversationRuns, useAgentChatContext} from '@/composables'
import {
  AGENT_CHAT_STATUS,
  AGENT_CHAT_TYPE_STYLE,
  AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
  STREAM_RUNNING_STATUS_VALUE
} from '@/constants'
import {addBubbleListMessage, createIcon, getEnumName, getEnumValue} from '@/utils'
import type {RoleType} from "@antdv-next/x/dist/bubble/interface";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";

/** Agent 气泡 role：ai 项按状态动态挂 loading */
export function createAgentBubbleListRole() {
  const baseAi = DEFAULT_BUBBLE_LIST_ROLE.ai
  return {
    ...DEFAULT_BUBBLE_LIST_ROLE,
    ai: (data: ChatBubbleItem) => {
      const isContentEmpty = !data.content || (data.content as AgentSseMessageContent[]).length <= 0
      const isRunning = data.data && STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue((data?.data as AgentMessageEntity).status))
      console.info(isContentEmpty, isRunning, data.data)
      return {
        ...(typeof baseAi === 'function' ? baseAi(data) : baseAi),
        variant:"borderless",
        shape:"round",
        loading: isContentEmpty && isRunning,
      }
    } ,
  } as RoleType
}

export function useAgentView() {
  const {conversationActive, activateConversation, loader, stream} = useAgentChatContext()
  const principalStore = usePrincipalStore()
  const bubbleListRef = ref<InstanceType<typeof LBubbleList>>()
  const senderRef = ref<InstanceType<typeof LAgentSender>>()

  const currentReedit = ref<StreamAgentMessageEntity>()

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
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          id: result.data.userMessageId,
          content: value.content,
          status: AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.USER,
          agentConversationId: conversationId
        }
        const assistantMessage: AgentMessageEntity = {
          id: result.data.assistantMessageId,
          content: [],
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          status: AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.AI,
          agentConversationId: conversationId,
          parentId: result.data.userMessageId,
        }

        addBubbleListMessage(userMessage, CHAT_BUBBLE_TYPE.USER, conversationActive.value.dataSource.elements, true)
        addBubbleListMessage(assistantMessage, CHAT_BUBBLE_TYPE.AI, conversationActive.value.dataSource.elements, true)
        stream.connect(result.data.assistantMessageId)
        senderRef.value?.clear()
        await nextTick()
      }

      bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
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
      await AgentService.interrupt(Number(run.key))
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

  function onReedit(entity:StreamAgentMessageEntity) {
    if (currentReedit.value) {
      currentReedit.value.reedit = false
    }
    entity.reedit = true;
    currentReedit.value = entity;
    //senderRef.value?.setValue(entity.content)
  }

  function onSenderChange(
    _value:string,
    _event?:Event,
    _slotConfigType?:SlotConfigType[]
  ) {
    if (_slotConfigType && _slotConfigType?.length > 0) {
      return
    }
    if (!currentReedit.value) {
      return
    }

    currentReedit.value.reedit = false
    currentReedit.value = undefined
  }

  function getChatType(type:number) {
    const style = AGENT_CHAT_TYPE_STYLE[String(type) as keyof typeof AGENT_CHAT_TYPE_STYLE]
    if (!style) {
      return {
        color:'default',
        icon:createIcon('loncra-file-exclamation-point'),
      }
    } else {
      return {
        color:style.color,
        icon:createIcon(style.icon),
      }
    }
  }

  return {
    bubbleListRef,
    senderRef,
    calcConversationCacheHitRate,
    copyText,
    onReedit,
    eachTokenUsage,
    countTokenUsage,
    currentReedit,
    conversationActive,
    principalStore,
    getChatType,
    loader,
    onSenderChange,
    onSenderSubmit,
    onSenderCancel,
  }
}
