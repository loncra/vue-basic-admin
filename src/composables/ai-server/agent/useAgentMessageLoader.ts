import {AI_SERVER_AGENT_CONVERSATION_TYPE} from '@loncra/client/ai'
import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref,} from 'vue'
import type {
  ActiveAgentConversationItem,
  AgentViewController,
  ChatBubbleItem
} from '@/types/composables'
import {addBubbleListMessage} from '@loncra/chat-core'
import {requireNonNullOrUndefined} from '@/utils'
import {CHAT_BUBBLE_TYPE, DEFAULT_PAGE_RESULT_VALUE} from '@/constants'
import {AgentService} from '@/apis'
import type {AgentMessageEntity} from '@/types/apis'
import type {PageResult, RestResult} from '@loncra/client/commons'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {getEnumValue} from '@loncra/client/commons'
import {useChatMessageList} from '@loncra/antdv-chat'

/**
 * 智能体活跃会话的消息分页、锚点跳转与会话切换。
 *
 * ⚠️ **骨架已抽进 `@loncra/antdv-chat` 的 `useChatMessageList`**（2026-10-01 S2b-1）：
 * 本文件只留 Agent 域自己的部分。**两域实测差异一律原样保留、未归一** —— 尤其：
 * - `pageOptionsFor`：Agent 把它当 `clear`（**疑似 bug**，触底加载"更新的页"会先清空列表）；
 * - `anchorJump: false`：Agent 侧"实时锚点跳转"原本就是注释掉的（这里是等价保留，不是新行为）。
 * 要不要归一，等用户拍（S2b 后续 / S3 随域迁入）。
 */
export function useAgentMessageLoader(
  conversationActive: Ref<ActiveAgentConversationItem | undefined>,
  view: Ref<AgentViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

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

  const list = useChatMessageList<ActiveAgentConversationItem, ChatBubbleItem>({
    active: conversationActive,
    view,
    // 差异 ②：Agent 取不到就**放弃本页**（不合并、不动 dataSource；IM 是兜底空页）
    fetchPage: async (number, active) => {
      const result: RestResult<PageResult<AgentMessageEntity>> = await AgentService.histories(
        {number, size: active.dataSource.size || DEFAULT_PAGE_RESULT_VALUE.size},
        Number(active.id),
      )
      return result.data
    },
    // 差异 ③：Agent 不传 `append`（`addBubbleListMessage` 默认 false ⇒ 新条目恒插头）
    mergeMessage: (body, elements) => {
      const d = body as AgentMessageEntity
      addBubbleListMessage(d, resolveBubbleRole(d), elements)
    },
    fetchPageNumberOf: async (messageId, active) => {
      const result: RestResult<number> = await AgentService.positioningMessagePageNumber(
        Number(active.id),
        messageId,
        active.dataSource.size || DEFAULT_PAGE_RESULT_VALUE.size,
      )
      return result.data
    },
    // 差异 ④：Agent 看 `loading`
    canLoad: (active) => !active.loading,
    /**
     * 差异 ⑤（⚠️ **疑似 bug，原样保留**）：Agent 原来写的是 `loadPage(number, tag === 'previous')`，
     * 而它的 `loadPage` 第 2 参是 **`clear`**（不是 IM 的 `prepend`）⇒ 触底加载"更新的一页"时
     * `clear = true` ⇒ **先清空列表**。IM 那边是 `{prepend: tag === 'previous'}`。
     * 归一前请先确认这是不是 bug（属"改行为"，不在 S2b-1 的搬运范围）。
     */
    pageOptionsFor: (tag) => ({clear: tag === 'previous'}),
    // 差异 ⑥：Agent 侧锚点跳转原本被注释掉 ⇒ 传 false 保持等价
    anchorJump: false,
    // A1：合成项的内容也进 `data.content`（条目已无 `content`）⇒ `toBubbleContent` 的 system 分支
    // 取块的文本值 ⇒ 渲染出来的仍是同一句话。`data` 是"无实体 UI 项"的桩（规范里 `data` 可选）。
    createNoMoreBubble: () => ({
      key: globalProperties.$dayjs().unix(),
      role: CHAT_BUBBLE_TYPE.SYSTEM,
      data: {
        content: [{type: 'text', value: globalProperties.$t('common.noMore')}],
      } as ChatBubbleItem['data'],
    }),
    createAnchorBubble: (systemMessage, at) => ({
      key: 'system-anchor-message-' + globalProperties.$dayjs().unix(),
      role: CHAT_BUBBLE_TYPE.SYSTEM,
      data: {
        content: [{type: 'text', value: systemMessage}],
        creationTime: at,
      } as ChatBubbleItem['data'],
    }),
  })

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
        // 原来这里是 `loadPage(1, reload)` ⇒ 等价 `{clear: reload}`
        await list.loadPage(1, {clear: reload})
        await nextTick()
        view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } finally {
        active.loading = false
      }
    } else {
      await list.positioningMessage(messageId)
    }
  }

  return {
    /** ⚠️ 形参变了：原 `(number, clear)` → 现 `(number, {prepend, clear})`（无外部调用点） */
    loadPage: list.loadPage,
    loadMore: list.loadMore,
    switchConversation,
    jumpToAnchorPage: list.jumpToAnchorPage,
    positioningMessage: list.positioningMessage,
  }
}

export type AgentMessageLoaderApi = ReturnType<typeof useAgentMessageLoader>
