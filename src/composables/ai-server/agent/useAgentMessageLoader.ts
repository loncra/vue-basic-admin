import {AI_SERVER_AGENT_CONVERSATION_TYPE} from '@loncra/client/ai'
import type {AgentMessageEntity} from '@loncra/client/ai'
import {type ComponentInternalInstance, getCurrentInstance, type Ref} from 'vue'
import type {ActiveAgentConversationItem, AgentViewController} from '@/types/composables'
import {requireNonNullOrUndefined} from '@/utils'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import {type ChatRole} from '@loncra/chat-core'
import {useAgentHistory} from '@loncra/antdv-chat-pro'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'

/**
 * 智能体活跃会话的消息分页、锚点跳转与会话切换。
 * 请求和分页在 useAgentHistory。这里只提供文案、角色、是否工作区会话，以及滚动。
 */
export function useAgentMessageLoader(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  view: Ref<AgentViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  function resolveBubbleRole(message: AgentMessageEntity): ChatRole {
    const role = getEnumValue(message.role)
    if (role === CHAT_BUBBLE_TYPE.AI) {
      return CHAT_BUBBLE_TYPE.AI
    }
    if (role === CHAT_BUBBLE_TYPE.SYSTEM) {
      return CHAT_BUBBLE_TYPE.SYSTEM
    }
    return CHAT_BUBBLE_TYPE.USER
  }

  return useAgentHistory(conversationActive, {
    noMoreText: () => globalProperties.$t('common.noMore'),
    nowUnix: () => globalProperties.$dayjs().unix(),
    resolveRole: resolveBubbleRole,
    isWorkspace: (conversation) =>
      getEnumValue(conversation.type as NameValueEnumMetadata<number> | number)
      === AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION,
    scrollToBottom: () => {
      view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    },
    jumpToMessage: (key) => {
      view.value?.jumpToMessage(key)
    },
  })
}

export type AgentMessageLoaderApi = ReturnType<typeof useAgentMessageLoader>
