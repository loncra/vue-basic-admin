import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref,} from 'vue'
import type {
  ActiveAgentConversationItem,
  AgentViewController,
  ChatBubbleItem
} from '@/types/composables'
import {addBubbleListMessage, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {AGENT_CONVERSATION_TYPE, CHAT_BUBBLE_TYPE, DEFAULT_PAGE_RESULT_VALUE} from '@/constants'
import {AgentService} from '@/apis'
import type {AgentMessageEntity, PageResult, RestResult} from '@/types/apis'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'

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

  function resolveBubbleRole(message: AgentMessageEntity): BubbleItemType['role'] {
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
      const retained = clear ? [] : active.dataSource.elements
      active.dataSource = {
        ...active.dataSource,
        ...result.data,
        elements: retained,
      }
      if (clear) {
        active.isOnFirstPage = result.data.first
        active.isOnLastPage = result.data.last
      } else {
        if (result.data.first) {
          active.isOnFirstPage = true
        }
        if (result.data.last) {
          active.isOnLastPage = true
        }
      }
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
    if (tag === 'next' && (active.isOnLastPage || active.dataSource.last)) {
      return
    }
    if (tag === 'previous' && (active.isOnFirstPage || active.dataSource.first)) {
      return
    }
    /*const reduceSort = (a: ChatBubbleItem, b: ChatBubbleItem) => {
      const flag =
        tag === 'previous'
          ? (a.data?.creationTime ?? 0) >= (b.data?.creationTime ?? 0)
          : (a.data?.creationTime ?? 0) <= (b.data?.creationTime ?? 0)
      return flag ? a : b
    }*/
    //const bubbles = active.dataSource.elements
    //const anchor = bubbles.length > 0 ? bubbles.reduce(reduceSort) : undefined

    await loadPage(
      tag === 'next' ? ++active.dataSource.number : --active.dataSource.number,
      tag === 'previous',
    )
    await nextTick()
    /*if (anchor) {
      view.value?.jumpToMessage(String(anchor.key), false, tag === 'next' ? 'nearest' : 'end')
    }*/
    if (active.dataSource.last && tag === 'next') {
      active.dataSource.elements.unshift({
        key: globalProperties.$dayjs().unix(),
        role: CHAT_BUBBLE_TYPE.SYSTEM,
        content: globalProperties.$t('common.noMore'),
      })
      active.isOnLastPage = true
    }
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
    active.isOnLastPage = false
    active.isOnFirstPage = false
    active.loading = true
    try {
      await loadPage(pageNumber, true)

      if (active.dataSource.elements.length <= 0) {
        return
      }

      const anchorIndex = active.dataSource.elements.findIndex((b) => b.key === String(messageId))
      let key: string | number | undefined

      if (anchorIndex < 0) {
        key = active.dataSource.elements.at(0)?.key
      } else {
        const anchorBubble = active.dataSource.elements[anchorIndex]
        if (anchorBubble) {
          key = anchorBubble.key
        }
        if (systemMessage && anchorBubble) {
          const anchorTime = anchorBubble.data?.creationTime ?? 0
          const newBubble: ChatBubbleItem = {
            key: 'system-anchor-message-' + globalProperties.$dayjs().unix(),
            role: CHAT_BUBBLE_TYPE.SYSTEM,
            content: systemMessage,
            data: {creationTime: anchorTime - 1} as ChatBubbleItem['data'],
          }
          active.dataSource.elements.splice(anchorIndex, 0, newBubble)
        }
      }

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
      getEnumValue(conversation.value.type) !== AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION
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
