import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  type MaybeRefOrGetter,
  nextTick,
  onUnmounted,
  ref,
  toValue,
  watch,
} from 'vue'
import type {BubbleItemType, BubbleListRef, RoleType} from '@antdv-next/x/dist/bubble/interface'
import type {
  ActiveChatSession,
  BubbleListCallbacks,
  BubbleListProps,
  ChatBubbleItem,
} from '@/types/composables'
import {throttle} from 'lodash-es'
import {requireNonNullOrUndefined} from '@/utils'

export const DEFAULT_BUBBLE_LIST_ROLE = {
  user: {
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: 'bg-primary-bg!'},
  },
  ai: {
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
  },
  system: {
    variant: 'outlined',
    shape: 'round',
    classes: {content: 'text-text-secondary!'},
  },
  divider: {
    dividerProps: {
      plain: true,
      dashed: true,
      size: 'small',
      classes: {
        content: 'text-text-secondary! text-xs! font-normal!',
        root: 'text-text-secondary! text-xs! font-normal! my-xs!',
      },
    },
  },
} as RoleType

/**
 * 无业务气泡列表：时间分隔、滚动分页、跳转闪烁、可见区探测。
 * 直接消费 ActiveChatSession（PageResult&lt;ChatBubbleItem&gt;）。
 */
export function useBubbleList(
  session: MaybeRefOrGetter<ActiveChatSession>,
  listProps: MaybeRefOrGetter<BubbleListProps>,
  callbacks: BubbleListCallbacks,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const showScrollToBottom = ref(false)
  const bubbleListRef = ref<BubbleListRef>()

  function getProps(): BubbleListProps {
    return toValue(listProps)
  }

  function getSession(): ActiveChatSession {
    return toValue(session)
  }

  function getItems(): ChatBubbleItem[] {
    return getSession().dataSource.elements ?? []
  }

  function hasOlder(): boolean {
    return !getSession().dataSource.last
  }

  function hasNewer(): boolean {
    return !getSession().dataSource.first
  }

  const bubbleListItems = computed(() => buildBubbleListWithDividers(getItems()))

  const handleThrottleBubbleScroll = throttle(
    throttleBubbleScroll,
    getProps().throttleOnScrollWait,
    {
      leading: true,
      trailing: true,
    },
  )

  const handleCollectVisible = throttle(emitVisibleItems, getProps().throttleCollectVisibleWait)

  function getMessageTime(item: ChatBubbleItem): number {
    return item.data?.creationTime ?? 0
  }

  function buildBubbleListWithDividers(messages: ChatBubbleItem[]): BubbleItemType[] {
    const sorted = [...messages.filter((s) => !s.hide)].sort(
      (a, b) => getMessageTime(a) - getMessageTime(b),
    )
    const result: BubbleItemType[] = []
    let lastDividerTime = 0
    for (const msg of sorted) {
      const msgTime = getMessageTime(msg)
      const needDivider =
        result.length === 0 ||
        (msgTime > 0 && msgTime - lastDividerTime >= getProps().timeDividerGap)
      if (needDivider && msgTime > 0) {
        result.push({
          key: `divider-${String(msg.key)}-${msgTime}`,
          role: 'divider',
          content: globalProperties.$dayjs(msgTime).fromNow(),
        })
        lastDividerTime = msgTime
      }
      result.push({
        ...msg,
        rootClass: 'rounded-lg ' + (msg.flashPending ? 'bg-flash' : ''),
      } as BubbleItemType)
    }
    return result
  }

  function jumpToBottom(type: 'reloadLastPage' | 'bottom' = 'bottom'): void {
    if (type === 'bottom') {
      bubbleListRef.value?.scrollTo({top: 'bottom'})
      return
    }
    callbacks.onReloadLastPage?.()
  }

  function jumpToMessage(
    key: string,
    flashPending: boolean = true,
    block: ScrollLogicalPosition = 'nearest',
    behavior: ScrollBehavior = 'auto',
  ): void {
    if (!bubbleListRef.value || !key) {
      return
    }
    const items = getItems()
    const index = items.findIndex((b) => String(b.key) === String(key))
    if (index < 0) {
      return
    }
    const bubble = items[index]
    if (!bubble) {
      return
    }
    bubble.flashPending = flashPending
    bubbleListRef.value?.scrollTo({key: key, behavior: behavior, block: block})
    if (!flashPending) {
      return
    }
    nextTick(() => tryFlashPendingItems(bubbleListRef.value?.scrollBoxNativeElement))
  }

  function throttleBubbleScroll(event: Event): void {
    const current = getSession()
    if (current.loading) {
      return
    }
    const scrollBox = event.target as HTMLElement
    if (callbacks.onVisibleItems) {
      handleCollectVisible(scrollBox)
    }
    if (hasOlder() && isNearOldest(scrollBox)) {
      callbacks.onLoadPage('next', scrollBox)
    } else if (hasNewer() && isNearNewest(scrollBox)) {
      callbacks.onLoadPage('previous', scrollBox)
    }
  }

  function isNearOldest(scrollBox: HTMLElement): boolean {
    return (
      scrollBox.scrollHeight + scrollBox.scrollTop <=
      scrollBox.clientHeight + getProps().topThreshold
    )
  }

  function isNearNewest(scrollBox: HTMLElement): boolean {
    return scrollBox.scrollTop >= -getProps().topThreshold
  }

  function emitVisibleItems(scrollBox: HTMLElement): void {
    if (!callbacks.onVisibleItems) {
      return
    }
    callbacks.onVisibleItems(getVisibleItems(scrollBox), scrollBox)
  }

  function onBubbleScroll(event: Event): void {
    const scrollBox = event.target as HTMLElement
    showScrollToBottom.value = scrollBox.scrollTop <= -getProps().scrollToBottomThreshold
    tryFlashPendingItems(scrollBox)
    handleThrottleBubbleScroll(event)
  }

  function getVisibleItems(
    scrollBox: HTMLElement,
    filter?: (item: ChatBubbleItem) => boolean | undefined,
  ): ChatBubbleItem[] {
    const scrollRect = scrollBox.getBoundingClientRect()
    const content = scrollBox.querySelector('.antd-bubble-list-scroll-content')
    if (!content) {
      return []
    }
    const items: ChatBubbleItem[] = []
    const children = content.children
    for (let i = 0; i < children.length && i < bubbleListItems.value.length; i++) {
      const item = bubbleListItems.value[i]
      if (!item || item.role === 'divider') {
        continue
      }
      const bubble = item as ChatBubbleItem
      if (filter && !filter(bubble)) {
        continue
      }
      const element = children[i] as HTMLElement
      const rect = element.getBoundingClientRect()
      if (rect.bottom > scrollRect.top && rect.top < scrollRect.bottom) {
        items.push(bubble)
      }
    }
    return items
  }

  function tryFlashPendingItems(scrollBox: HTMLElement | undefined): void {
    if (!scrollBox) {
      return
    }
    const items = getVisibleItems(scrollBox, (item) => item.flashPending === true)
    for (const visibleItem of items) {
      const bubble = getItems().find((b) => String(b.key) === String(visibleItem.key))
      if (!bubble) {
        continue
      }
      nextTick(() => setTimeout(() => (bubble.flashPending = false), 2000))
      break
    }
  }

  function tryEmitVisibleItems(): void {
    if (!callbacks.onVisibleItems) {
      return
    }
    const scrollBox = bubbleListRef.value?.scrollBoxNativeElement
    if (scrollBox) {
      handleCollectVisible(scrollBox)
    }
  }

  if (callbacks.onVisibleItems) {
    watch(bubbleListItems, async (items) => {
      if (items.length === 0) {
        return
      }
      await nextTick()
      tryEmitVisibleItems()
    })

    window.addEventListener('focus', tryEmitVisibleItems)
    document.addEventListener('visibilitychange', tryEmitVisibleItems)
  }

  onUnmounted(() => {
    handleCollectVisible.cancel()
    handleThrottleBubbleScroll.cancel()
    if (callbacks.onVisibleItems) {
      window.removeEventListener('focus', tryEmitVisibleItems)
      document.removeEventListener('visibilitychange', tryEmitVisibleItems)
    }
  })

  function getScrollBox(): HTMLElement | undefined {
    return bubbleListRef.value?.scrollBoxNativeElement
  }

  function scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void {
    bubbleListRef.value?.scrollTo(options)
  }

  return {
    bubbleListRef,
    bubbleListItems,
    bubbleListRole: DEFAULT_BUBBLE_LIST_ROLE,
    showScrollToBottom,
    onBubbleScroll,
    jumpToBottom,
    jumpToMessage,
    getVisibleItems,
    getScrollBox,
    scrollTo,
  }
}

export type BubbleListApi = ReturnType<typeof useBubbleList>
