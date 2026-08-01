import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps,
  AgentSseMessageContent,
  AgentTokenUsageContent,
  BlockDeltaContentMetadata,
  ChatBubbleItem,
} from '@/types/composables'
import type {AgentMessageEntity, RestResult, StreamAgentMessageEntity} from '@/types/apis'
import {AgentService} from '@/apis'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref, ref} from 'vue'
import type LAgentSender from '@/components/ai-server/agent/AgentSender.vue'
import type LBubbleList from '@/components/basic/chat/BubbleList.vue'
import useApp from 'antdv-next/dist/app/useApp'
import {DEFAULT_BUBBLE_LIST_ROLE, useAgentChatContext} from '@/composables'
import {AGENT_CHAT_STATUS, AGENT_CONTENT_TYPE, BUBBLE_TYPES, CHAT_BUBBLE_TYPE} from '@/constants'
import {addBubbleListMessage, getEnumValue, requireNonNullOrUndefined} from '@/utils'
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
  // 每个 ChatBubbleItem 的 expandedKeys 状态（按 item.key 索引）
  const thoughtChainExpandedKeysRecord: Ref<Record<string, string[]>> = ref({})

  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

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
      }

      bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      conversationActive.value.loading = false
    }
  }

  /** 纯计算：从 item 提取 ThoughtChainItem 列表 */
  /*function computeThoughtChainItems(item: ChatBubbleItem): ThoughtChainItemType[] {
    const items: ThoughtChainItemType[] = []
    if (!conversationActive.value) {
      return items
    }
    const contents = item.content as AgentSseMessageContent[]
    for (const block of contents.filter(s => THOUGHT_CHAIN_TYPES.includes(s.type))) {
      if (block.type === AGENT_CONTENT_TYPE.THINK) {
        const think = block as AgentThinkBlock
        items.push({
          key: think.id,
          title: globalProperties.$t('agent.think'),
          content: think.value || '',
          status: think.value ? 'success' : 'loading',
          blink: getEnumValue((block as BlockDeltaContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING,
          collapsible: true,
        })
      } else if (block.type === AGENT_CONTENT_TYPE.TOOL) {
        const toolCall = block as AgentToolCallBlock;
        items.push({
          key: toolCall.id,
          title: toolCall.name,
          description: toolCall.value || '',
          content: toolCall.output,
          status: toolCall.status ? 'success' : 'loading',
          blink: getEnumValue((block as BlockDeltaContentMetadata).status) === AGENT_BLOCK_STATUS.RUNNING,
          collapsible: true,
        })
      }
    }
    return items
  }*/

  /*function getAiBubbleContents(item:ChatBubbleItem):BlockDeltaContentMetadata[] {
    const contents = (item.content || []) as AgentSseMessageContent[]
    return (contents.filter(s => BUBBLE_TYPES.includes(s.type)) || []) as BlockDeltaContentMetadata[]
  }*/

  /** 一次调用返回 items + expandedKeys，首次自动懒初始化 */
  /*function getThoughtChainConfig(item: ChatBubbleItem): { items: ThoughtChainItemType[]; expandedKeys: string[] } {
    const items = computeThoughtChainItems(item)

    // 懒初始化：当前 item 未初始化过，则默认展开所有 blink 的项
    if (!(item.key in thoughtChainExpandedKeysRecord.value)) {
      thoughtChainExpandedKeysRecord.value[item.key] = items
        .filter(s => s.blink)
        .map(s => s.key) as string[]
    }

    return {
      items,
      expandedKeys: thoughtChainExpandedKeysRecord.value[item.key] ?? [],
    }
  }*/

  /** onExpand 回调：用户手动展开/收起时更新对应 item 的 expandedKeys */
  /*function onThoughtChainExpand(itemKey: string, keys: string[]) {
    thoughtChainExpandedKeysRecord.value[itemKey] = keys
  }*/

  function countTokenUsage(item:ChatBubbleItem) {
    const message = item.data as AgentMessageEntity
    return ((message?.metadata?.tokenUsage || []) as AgentTokenUsageContent[]).reduce((acc:number, cur) => acc + cur.inputTokens + cur.outputTokens + cur.cachedTokens, 0)
  }

  async function copyText(item:StreamAgentMessageEntity) {
    try {
      const text = item.content
        .filter(s => getEnumValue(s.type) === AGENT_CONTENT_TYPE.ANSWER)
        .map(s => (s as BlockDeltaContentMetadata).value)
        .at(-1)
      await navigator.clipboard.writeText(text || "");
      item.copy = true;
      // 可选：给个提示
      // message.success('已复制到剪贴板');
    } catch {
      // 复制失败处理
    }
  }

  return {
    bubbleListRef,
    /*getThoughtChainConfig,
    getAiBubbleContents,
    onThoughtChainExpand,*/
    senderRef,
    copyText,
    countTokenUsage,
    conversationActive,
    principalStore,
    loader,
    onSenderSubmit,
  }
}
