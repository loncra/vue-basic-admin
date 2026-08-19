import {type ComponentInternalInstance, getCurrentInstance, nextTick, type Ref} from 'vue'
import type {
  PageResult,
  RestResult,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
} from '@/types/apis'
import type {
  ChatBubbleItem,
  ChatViewController,
  ServerConversationItem,
  UserChatConversationActiveProps,
} from '@/types/composables'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {addBubbleListMessage, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {CHAT_BUBBLE_TYPE, DEFAULT_PAGE_RESULT_VALUE, USER_CHAT_MESSAGE_TYPE} from '@/constants'

/**
 * 活跃会话的消息分页、锚点跳转与会话切换。
 * 气泡单轨：dataSource.elements 为 ChatBubbleItem[]；分页防重入用内聚 pageLock。
 */
export function useChatMessageLoader(
  conversationActive: Ref<UserChatConversationActiveProps>,
  view: Ref<ChatViewController | undefined>,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties
  const principalStore = usePrincipalStore()

  let pageLock = false

  function resolveRole(d: UserChatMessageResponseBody): BubbleItemType['role'] {
    let role: BubbleItemType['role'] =
      principalStore.state.name ===
      (d.participant?.metadata?.details as {systemName: string})?.systemName
        ? CHAT_BUBBLE_TYPE.USER
        : CHAT_BUBBLE_TYPE.AI
    if (getEnumValue(d.type) === USER_CHAT_MESSAGE_TYPE.SYSTEM) {
      role = CHAT_BUBBLE_TYPE.SYSTEM
    }
    return role
  }

  async function loadPage(
    chatRoomId: number,
    number: number,
    append: boolean = false,
    clear: boolean = false,
  ): Promise<void> {
    const active = conversationActive.value
    if (pageLock) {
      return
    }
    const request = {
      number,
      withoutReadableAnchor: active.readableAnchorLoading,
    }
    try {
      pageLock = true
      const result: RestResult<PageResult<UserChatMessageResponseBody>> =
        await ChatMessageService.histories(request, chatRoomId)

      const page = result?.data || DEFAULT_PAGE_RESULT_VALUE
      const retained = clear ? [] : active.dataSource.elements
      active.dataSource = {
        ...active.dataSource,
        ...page,
        elements: retained,
      }
      // 到达端页则锁住；clear/首屏以当前页为准同步两端标志
      if (clear) {
        active.isOnFirstPage = page.first
        active.isOnLastPage = page.last
      } else {
        if (page.first) {
          active.isOnFirstPage = true
        }
        if (page.last) {
          active.isOnLastPage = true
        }
      }
      for (const d of page.elements || []) {
        addBubbleListMessage(d, resolveRole(d), active.dataSource.elements, !append)
      }
    } finally {
      pageLock = false
    }
  }

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
      active.item.data.draft = view.value.getSenderSlotConfigValue()
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
      await loadParticipant(Number(active.item?.data?.room?.id))
      if (!messageId) {
        await loadPage(Number(active.item.data.room.id), 1, false, reload)
        await nextTick()
        view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } else {
        await positioningMessage(messageId, Number(active.item.data.room.id))
      }
    } finally {
      active.loading = false
    }
  }

  async function loadMore(tag: 'next' | 'previous'): Promise<void> {
    await nextTick()
    const active = conversationActive.value
    if (pageLock) {
      return
    }
    if (tag === 'next' && (active.isOnLastPage || active.dataSource.last)) {
      return
    }
    if (tag === 'previous' && (active.isOnFirstPage || active.dataSource.first)) {
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
    const bubbles = active.dataSource.elements
    const anchor = bubbles.length > 0 ? bubbles.reduce(reduceSort) : undefined

    await loadPage(
      roomId,
      tag === 'next' ? ++active.dataSource.number : --active.dataSource.number,
      tag === 'previous',
    )
    await nextTick()
    if (anchor) {
      view.value?.jumpToMessage(String(anchor.key), false, tag === 'next' ? 'nearest' : 'end')
    }
    if (active.dataSource.last && tag === 'next') {
      active.dataSource.elements.unshift({
        key: globalProperties.$dayjs().unix(),
        role: CHAT_BUBBLE_TYPE.SYSTEM,
        content: globalProperties.$t('common.noMore'),
      })
      active.isOnLastPage = true
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
            data: {creationTime: anchorTime - 1} as UserChatMessageResponseBody,
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
    const index = active.dataSource.elements.findIndex((d) => d.key === String(data.id))
    if (index >= 0) {
      const anchorBubble = active.dataSource.elements[index]
      if (!anchorBubble) {
        return
      }
      view.value?.jumpToMessage(String(anchorBubble.key))
      return
    }
    await positioningMessage(Number(data.id), Number(active.item?.data?.room?.id))
  }

  async function positioningMessage(messageId: number, roomId: number): Promise<void> {
    const active = conversationActive.value
    if (!active.item) {
      return
    }
    try {
      active.loading = true
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        roomId,
        messageId,
        active.dataSource.size,
      )
      if (result.data) {
        await jumpToAnchorPage(messageId, result.data)
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
    loadParticipant,
    toReadableAnchor,
    jumpToHistoryMessage,
  }
}

export type ChatMessageLoaderApi = ReturnType<typeof useChatMessageLoader>
