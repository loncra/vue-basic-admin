import {AI_SERVER_AGENT_CONVERSATION_TYPE} from '@loncra/client/ai'
import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref,} from 'vue'
import type {
  ActiveAgentConversationItem,
  AgentViewController,
} from '@/types/composables'
import {addBubbleListMessage, requireNonNullOrUndefined} from '@/utils'
import type {ChatRole} from '@loncra/chat-core'
import {CHAT_BUBBLE_TYPE, DEFAULT_PAGE_RESULT_VALUE} from '@/constants'
import {
  applyHistoryPage,
  canLoadHistory,
  locateAnchor,
  openPageEdges,
  prependNoMoreIfLast,
  stepPageNumber,
  textBubble,
} from '@loncra/chat-core'
import {AgentService} from '@/apis'
import type {AgentMessageEntity} from '@/types/apis'
import type {PageResult, RestResult} from '@loncra/client/commons'
import {getEnumValue} from '@loncra/client/commons'

/**
 * 智能体活跃会话的消息分页、锚点跳转与会话切换。
 */
export function useAgentMessageLoader(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  view: Ref<AgentViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  let pageLock = false

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

  async function loadPage(
    number: number,
    clear: boolean = false,
  ): Promise<void> {
    const active = conversationActive.value
    if (!active || pageLock) {
      return
    }
    try {
      pageLock = true
      const result: RestResult<PageResult<AgentMessageEntity>> = await AgentService.histories(
        {number, size: active.dataSource.size || DEFAULT_PAGE_RESULT_VALUE.size},
        Number(active.id),
      )
      if (!result.data) {
        return
      }
      applyHistoryPage(active, result.data, clear)
      for (const d of result.data.elements || []) {
        addBubbleListMessage(d, resolveBubbleRole(d), active.dataSource.elements)
      }
    } finally {
      pageLock = false
    }
  }

  async function loadMore(tag: 'next' | 'previous'): Promise<void> {
    await nextTick()
    const active = conversationActive.value
    if (!active || active.loading || pageLock) {
      return
    }
    if (!canLoadHistory(active, tag)) {
      return
    }
    // 锚点滚动恢复保持关闭，不调用 pageEdgeBubble。

    active.dataSource.number = stepPageNumber(active.dataSource.number, tag)
    await loadPage(active.dataSource.number)
    await nextTick()
    prependNoMoreIfLast(
      active,
      tag,
      textBubble(globalProperties.$dayjs().unix(), globalProperties.$t('common.noMore')),
    )
  }

  async function positioningMessage(messageId: number): Promise<void> {
    const active = conversationActive.value
    if (!active) {
      return
    }
    try {
      active.loading = true
      const result: RestResult<number> = await AgentService.positioningMessagePageNumber(
        Number(active.id),
        messageId,
        active.dataSource.size || DEFAULT_PAGE_RESULT_VALUE.size,
      )
      if (result.data) {
        await jumpToAnchorPage(messageId, result.data)
      }
    } finally {
      active.loading = false
    }
  }

  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const active = conversationActive.value
    if (!active) {
      return
    }
    openPageEdges(active)
    active.loading = true
    try {
      await loadPage(pageNumber, true)

      const anchorBubble = active.dataSource.elements.find((item) => item.key === String(messageId))
      const key = locateAnchor(
        active.dataSource.elements,
        messageId,
        systemMessage && anchorBubble
          ? textBubble(
            'system-anchor-message-' + globalProperties.$dayjs().unix(),
            systemMessage,
            'system',
            (anchorBubble.creationTime ?? 0) - 1,
          )
          : undefined,
      )

      await nextTick()
      if (!view.value || key === undefined) {
        return
      }
      view.value.jumpToMessage(String(key))
    } finally {
      active.loading = false
    }
  }

  async function switchConversation(
    conversation: Ref<ActiveAgentConversationItem | undefined>,
    messageId?: number,
    reload: boolean = false,
  ): Promise<void> {
    if (
      !conversation.value ||
      getEnumValue(conversation.value.type) !== AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION
    ) {
      return
    }

    if (!messageId) {
      const active = conversation.value
      active.loading = true
      try {
        active.isOnFirstPage = true
        active.isOnLastPage = false
        await loadPage(1, reload)
        await nextTick()
        view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } finally {
        active.loading = false
      }
    } else {
      await positioningMessage(messageId)
    }
  }

  return {
    loadPage,
    loadMore,
    switchConversation,
    jumpToAnchorPage,
    positioningMessage,
  }
}

export type AgentMessageLoaderApi = ReturnType<typeof useAgentMessageLoader>
