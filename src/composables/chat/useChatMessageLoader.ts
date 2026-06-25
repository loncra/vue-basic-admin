import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref,} from 'vue'
import type {PageResult, RestResult, UserChatMessageResponseBody,} from '@/types/apis'
import type {
  ChatBubbleItem,
  ConversationActiveProps,
  ServerConversationItem,
} from '@/types/composables'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {addBubbleListMessage} from '@/composables/chat/chatBubbleHelper.ts'
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {CHAT_BUBBLE_TYPE} from '@/constants/messageConstant.ts'
import {DEFAULT_PAGE_RESULT_VALUE} from '@/constants/systemConstant.ts'

/** 加载器需要的会话视图能力（由 ChatView defineExpose 提供） */
export interface ChatViewController {
  jumpToMessage(
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ): void
  scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void
  getSenderSlotConfigValue(): SlotConfigType[]
}

/**
 * 活跃会话的消息分页、锚点跳转与会话切换。
 * 迁移 MyChatMessage 中最重的一块：loadConversationData / onChatViewLoadPage /
 * toMessageAnchorPage / toReadableAnchor / onHistoryClick / onConversationsChange。
 */
export function useChatMessageLoader(
  conversationActive: Ref<ConversationActiveProps>,
  view: Ref<ChatViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties
  const principalStore = usePrincipalStore()

  async function loadPage(
    chatRoomId: number,
    number: number,
    append: boolean = false,
    clear: boolean = false,
  ): Promise<void> {
    const active = conversationActive.value
    if (active.loadConversationDataLock) {
      return
    }
    const request = {
      number,
      withoutReadableAnchor: active.readableAnchorLoading,
    }
    try {
      active.loadConversationDataLock = true
      const result: RestResult<PageResult<UserChatMessageResponseBody>> =
        await ChatMessageService.histories(request, chatRoomId)

      active.dataSource = result?.data || DEFAULT_PAGE_RESULT_VALUE
      if (!active.isOnFirstPage) {
        active.isOnFirstPage = active.dataSource.first
      }
      if (!active.isOnLastPage) {
        active.isOnLastPage = active.dataSource.last
      }
      const elements = active.dataSource.elements || []
      if (clear) {
        active.bubbleList = []
      }
      for (const d of elements) {
        let role: BubbleItemType['role'] =
          principalStore.state.name ===
          (d.participant?.metadata?.details as {systemName: string})?.systemName
            ? CHAT_BUBBLE_TYPE.USER
            : CHAT_BUBBLE_TYPE.AI
        if (getEnumValue(d.type) === 20) {
          role = CHAT_BUBBLE_TYPE.SYSTEM
        }
        addBubbleListMessage(d, role, active.bubbleList, !append)
      }
    } finally {
      active.loadConversationDataLock = false
    }
  }

  /** 切换 / 重载活跃会话（含草稿暂存与滚动到底） */
  async function switchConversation(
    item: ServerConversationItem,
    reload: boolean = false,
  ): Promise<void> {
    const active = conversationActive.value
    if (active.loading) {
      return
    }
    if (active.item?.data && view.value) {
      active.item.data.draft = view.value.getSenderSlotConfigValue()
    }
    if (active.item?.key === item.key && !reload) {
      active.item = {...active.item, ...item}
      return
    }
    active.loading = true
    try {
      active.item = item
      active.bubbleList = []
      await loadPage(Number(active.item?.data?.room?.id), 1, false, reload)
      await nextTick()
      view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } finally {
      active.loading = false
    }
  }

  async function loadMore(tag: 'next' | 'previous'): Promise<void> {
    await nextTick()
    const active = conversationActive.value
    if (active.loadConversationDataLock) {
      return
    }
    if (tag === 'next' && active.isOnLastPage) {
      return
    }
    if (tag === 'previous' && active.isOnFirstPage) {
      return
    }
    const roomId = Number(active.item?.data?.room?.id)
    if (!roomId) {
      return
    }
    const reduceSort = (a: ChatBubbleItem, b: ChatBubbleItem) => {
      const flag =
        tag === 'previous'
          ? (a.data?.creationTime ?? 0) >= (b.data?.creationTime ?? 0)
          : (a.data?.creationTime ?? 0) <= (b.data?.creationTime ?? 0)
      return flag ? a : b
    }
    // 锚点：当前已加载的最旧一条消息（加载后它会被新内容顶到下面）
    const bubbles = active.bubbleList
    const anchor = bubbles.length > 0 ? bubbles.reduce(reduceSort) : undefined

    await loadPage(
      roomId,
      tag === 'next' ? ++active.dataSource.number : --active.dataSource.number,
      tag === 'previous',
    )
    await nextTick()
    if (anchor) {
      view.value?.jumpToMessage(anchor.key as string, false, tag === 'next' ? 'nearest' : 'end')
    }
    if (active.dataSource.last && tag === 'next') {
      active.bubbleList.unshift({
        key: globalProperties.$dayjs().unix(),
        role: CHAT_BUBBLE_TYPE.SYSTEM,
        content: globalProperties.$t('common.noMore'),
      })
    }
  }

  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const active = conversationActive.value
    active.isOnLastPage = false
    active.isOnFirstPage = false
    active.loading = true
    try {
      await loadPage(Number(active.item?.data?.room?.id), pageNumber, false, true)

      if (active.bubbleList.length <= 0) {
        return
      }

      const anchorIndex = active.bubbleList.findIndex((b) => b.key === String(messageId))
      let key

      if (anchorIndex < 0) {
        key = active.bubbleList.at(0)?.key
      } else {
        const anchorBubble = active.bubbleList[anchorIndex]
        if (anchorBubble) {
          key = anchorBubble.key
        }
        if (systemMessage) {
          const anchorTime = anchorBubble?.data?.creationTime ?? 0
          const newBubble = {
            key: 'system-anchor-message-' + globalProperties.$dayjs().unix(),
            role: CHAT_BUBBLE_TYPE.SYSTEM,
            content: systemMessage,
            data: {creationTime: anchorTime - 1} as UserChatMessageResponseBody,
          }
          active.bubbleList.splice(anchorIndex, 0, newBubble)
        }
      }

      await nextTick()
      if (!view.value) {
        return
      }
      view.value.jumpToMessage(String(key))
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
    await jumpToAnchorPage(
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
    const index = active.bubbleList.findIndex((d) => d.key === String(data.id))
    if (index >= 0) {
      const anchorBubble = active.bubbleList[index]
      if (!anchorBubble) {
        return
      }
      view.value?.jumpToMessage(String(anchorBubble.key))
      return
    }
    try {
      active.loading = true
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        Number(active.item?.data?.room?.id),
        Number(data.id),
        active.dataSource.size,
      )
      if (result.data) {
        await jumpToAnchorPage(Number(data.id), result.data)
      }
    } finally {
      active.loading = false
    }
  }

  return {
    loadPage,
    switchConversation,
    loadMore,
    jumpToAnchorPage,
    showReadableAnchorButton,
    toReadableAnchor,
    jumpToHistoryMessage,
  }
}

export type ChatMessageLoaderApi = ReturnType<typeof useChatMessageLoader>
