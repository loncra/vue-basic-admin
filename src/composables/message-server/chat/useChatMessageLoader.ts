import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref} from 'vue'
import type {UserChatMessageResponseBody} from '@/types/apis'
import type {PageResult, RestResult} from '@loncra/client/commons'
import type {UserChatParticipantEntity} from '@loncra/client/message'
import {ChatMessageService, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE} from '@loncra/client/message'
import type {
  ChatBubbleItem,
  ChatViewController,
  ServerConversationItem,
  UserChatConversationActiveProps,
} from '@/types/composables'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {addBubbleListMessage} from '@loncra/chat-core'
import {requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {CHAT_BUBBLE_TYPE, DEFAULT_PAGE_RESULT_VALUE} from '@/constants'
import {getEnumValue} from '@loncra/client/commons'
import {useChatMessageList} from '@loncra/antdv-chat'

/**
 * 活跃会话的消息分页、锚点跳转与会话切换。
 * 气泡单轨：dataSource.elements 为 ChatBubbleItem[]；分页防重入用内聚 pageLock。
 *
 * ⚠️ **分页 / 锚点 / 合入的骨架已抽进 `@loncra/antdv-chat` 的 `useChatMessageList`**（2026-10-01 S2b-1）：
 * 本文件只留 **IM 域自己的部分** —— 角色判定、请求组装、房间参与者、切会话（草稿写回 / hydrate）、
 * 已读锚点入口、历史消息跳转。两域实测差异（7 处）见适配器里逐条的注释（含 Agent 侧 2 处疑似 bug，**未归一**）。
 */
export function useChatMessageLoader(
  conversationActive: Ref<UserChatConversationActiveProps>,
  view: Ref<ChatViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties
  const principalStore = usePrincipalStore()

  function resolveRole(d: UserChatMessageResponseBody): BubbleItemType['role'] {
    let role: BubbleItemType['role'] =
      principalStore.state.name ===
      (d.participant?.metadata?.details as {systemName: string})?.systemName
        ? CHAT_BUBBLE_TYPE.USER
        : CHAT_BUBBLE_TYPE.AI
    if (getEnumValue(d.type) === MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM) {
      role = CHAT_BUBBLE_TYPE.SYSTEM
    }
    return role
  }

  const list = useChatMessageList<UserChatConversationActiveProps, ChatBubbleItem>({
    active: conversationActive,
    view,
    // 差异 ②：IM 失败时用**兜底空页**（`first`/`last` 都是 true ⇒ 直接把两端锁住），不存在"放弃本页"
    fetchPage: async (number, active) => {
      const result: RestResult<PageResult<UserChatMessageResponseBody>> =
        await ChatMessageService.histories(
          {number, withoutReadableAnchor: active.readableAnchorLoading},
          Number(active.item?.data?.room?.id),
        )
      return result?.data || DEFAULT_PAGE_RESULT_VALUE
    },
    // 差异 ③：IM 传 `!prepend`（更早的页插头、更新的页插尾）
    mergeMessage: (body, elements, prepend) => {
      const d = body as UserChatMessageResponseBody
      addBubbleListMessage(d, resolveRole(d), elements, !prepend)
    },
    fetchPageNumberOf: async (messageId, active) => {
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        Number(active.item?.data?.room?.id),
        messageId,
        active.dataSource.size,
      )
      return result.data
    },
    // 差异 ④：房间 id 必须有效
    canLoad: (active) => !!Number(active.item?.data?.room?.id),
    // 差异 ⑤：'previous'（更新的一页）插尾
    pageOptionsFor: (tag) => ({prepend: tag === 'previous'}),
    // 差异 ⑥：IM 有"实时锚点跳转"（Agent 侧那段被注释掉了）
    anchorJump: true,
    // A1：合成项的内容也进 `data.content`（条目已无 `content`）⇒ `toBubbleContent` 的 system 分支
    // 取块的文本值 ⇒ 渲染出来的仍是同一句话。`data` 是"无实体 UI 项"的桩（规范里 `data` 可选）。
    createNoMoreBubble: () => ({
      key: globalProperties.$dayjs().unix(),
      role: CHAT_BUBBLE_TYPE.SYSTEM,
      data: {
        content: [{type: 'text', value: globalProperties.$t('common.noMore')}],
      } as UserChatMessageResponseBody,
    }),
    createAnchorBubble: (systemMessage, at) => ({
      key: 'system-anchor-message-' + globalProperties.$dayjs().unix(),
      role: CHAT_BUBBLE_TYPE.SYSTEM,
      data: {
        content: [{type: 'text', value: systemMessage}],
        creationTime: at,
      } as UserChatMessageResponseBody,
    }),
  })

  async function loadParticipant(roomId: number): Promise<void> {
    const result: RestResult<UserChatParticipantEntity[]> =
      await ChatMessageService.findRoomParticipant(roomId)
    if (result.data) {
      conversationActive.value.participants = result.data
    }
  }

  async function switchConversation(
    item: ServerConversationItem,
    messageId?: number,
    reload: boolean = false,
  ): Promise<void> {
    const active = conversationActive.value
    if (active.loading) {
      return
    }
    if (active.item?.data && view.value) {
      // 先写回列表项（内存「[草稿]」），再 persist；此时 targetId 仍是旧房间。
      // 换 item 之后才 hydrate，避免用新房间 id 把旧稿写进 IDB。
      active.item.data.draft = view.value.getSenderSlotConfigValue()
      await view.value.persistSenderDraft()
    }
    if (active.item?.key === item.key && !reload) {
      active.item = {...active.item, ...item}
      return
    }
    active.loading = true
    active.drawerOpen = false
    try {
      active.item = item
      active.isOnFirstPage = true
      active.isOnLastPage = false
      active.dataSource = {...DEFAULT_PAGE_RESULT_VALUE, elements: []}
      if (!active.item?.data?.room) {
        return
      }
      await nextTick()
      if (!view.value) {
        await nextTick()
      }
      await view.value?.hydrateSenderDraft()
      await loadParticipant(Number(active.item?.data?.room?.id))
      if (!messageId) {
        // 原来这里是 `loadPage(roomId, 1, prepend=false, clear=reload)` ⇒ 等价 `{clear: reload}`
        await list.loadPage(1, {clear: reload})
        await nextTick()
        view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } else {
        // 原来要显式传 roomId；现在房间 id 由 `fetchPageNumberOf` 从 active 取（同一个值）
        await list.positioningMessage(messageId)
      }
    } finally {
      active.loading = false
    }
  }

  function showReadableAnchorButton(): boolean {
    return (
      !conversationActive.value.loading &&
      !!conversationActive.value.dataSource?.metadata?.readableAnchorId
    )
  }

  async function toReadableAnchor(): Promise<void> {
    const active = conversationActive.value
    if (!active.item) {
      return
    }
    if (!active.dataSource?.metadata?.readableAnchorPage) {
      return
    }
    const readableAnchorId = active.dataSource?.metadata?.readableAnchorId
    if (!readableAnchorId) {
      return
    }
    active.readableAnchorLoading = true
    await list.jumpToAnchorPage(
      Number(readableAnchorId),
      Number(active.dataSource?.metadata?.readableAnchorPage),
      globalProperties.$t('chat.view.readable.systemMessage'),
    )
  }

  async function jumpToHistoryMessage(data: UserChatMessageResponseBody): Promise<void> {
    const active = conversationActive.value
    if (!active.item) {
      return
    }
    active.drawerOpen = false
    await nextTick()
    const index = active.dataSource.elements.findIndex((d) => d.key === String(data.id))
    if (index >= 0) {
      const anchorBubble = active.dataSource.elements[index]
      if (!anchorBubble) {
        return
      }
      view.value?.jumpToMessage(String(anchorBubble.key))
      return
    }
    await list.positioningMessage(Number(data.id))
  }

  return {
    /** ⚠️ 形参变了：原 `(chatRoomId, number, append, clear)` → 现 `(number, {prepend, clear})`
     *  （`chatRoomId` 无外部调用点，房间 id 由域适配器从 active 取） */
    loadPage: list.loadPage,
    switchConversation,
    loadMore: list.loadMore,
    jumpToAnchorPage: list.jumpToAnchorPage,
    showReadableAnchorButton,
    loadParticipant,
    toReadableAnchor,
    jumpToHistoryMessage,
  }
}

export type ChatMessageLoaderApi = ReturnType<typeof useChatMessageLoader>
