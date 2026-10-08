import {computed, type MaybeRefOrGetter, nextTick, onUnmounted, ref, toValue, watch,} from 'vue'
import type {BubbleItemType, BubbleListRef, RoleType} from '@antdv-next/x/dist/bubble/interface'
import {bubbleListContent} from '@loncra/chat-core'
import {STREAM_RUNNING_STATUS_VALUE} from '@/constants'
import {getEnumValue} from '@loncra/client/commons'
import type {
  ActiveChatSession,
  BubbleListCallbacks,
  BubbleListProps,
  ChatBubbleItem,
} from '@/types/composables'
import {throttle} from 'lodash-es'

/**
 * 只留下 ax-bubble 会读的字段。
 * 消息 id、Agent status 与组件自己的 id、status 重名，不能摊到这一层。
 * 业务字段留在 ChatBubbleItem 上，插槽按渲染下标取回。
 */
export function toAxBubbleItem(
  item: ChatBubbleItem,
  extra?: Partial<BubbleItemType>,
): BubbleItemType {
  const content = bubbleListContent(item)
  const empty = typeof content === 'string' ? content.length === 0 : content.length === 0
  const running = 'status' in item
    && STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(item.status))
  const loading = Boolean(item.loading || extra?.loading || (empty && running))
  return {
    ...extra,
    key: item.key,
    role: item.role,
    content,
    ...(loading ? {loading: true} : {}),
  }
}

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
 * 无业务气泡列表：滚动分页、跳转闪烁、可见区探测。
 * 直接消费 ActiveChatSession；可选外部 items（如 IM 带时间分隔的列表）。
 */
export function useBubbleList(
  session: MaybeRefOrGetter<ActiveChatSession>,
  listProps: MaybeRefOrGetter<BubbleListProps>,
  callbacks: BubbleListCallbacks
) {
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

  const rows = computed(() => callbacks.renderItem(getItems()))
  const domainItems = computed(() => rows.value.map((row) => row.bubble))
  const bubbleListItems = computed(() => rows.value.map((row) => toAxBubbleItem(
    row.bubble,
    row.rootClass ? {rootClass: row.rootClass} : undefined,
  )))

  const handleThrottleBubbleScroll = throttle(
    throttleBubbleScroll,
    getProps().throttleOnScrollWait,
    {
      leading: true,
      trailing: true,
    },
  )

  const handleCollectVisible = throttle(emitVisibleItems, getProps().throttleCollectVisibleWait)

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
    const sourceItems = getItems()
    const index = sourceItems.findIndex((b) => String(b.key) === String(key))
    if (index < 0) {
      return
    }
    const bubble = sourceItems[index]
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
    const visible: ChatBubbleItem[] = []
    const children = content.children
    for (let i = 0; i < children.length && i < domainItems.value.length; i++) {
      const bubble = domainItems.value[i]
      if (!bubble || bubble.role === 'divider') {
        continue
      }
      if (filter && !filter(bubble)) {
        continue
      }
      const element = children[i] as HTMLElement
      const rect = element.getBoundingClientRect()
      if (rect.bottom > scrollRect.top && rect.top < scrollRect.bottom) {
        visible.push(bubble)
      }
    }
    return visible
  }

  function tryFlashPendingItems(scrollBox: HTMLElement | undefined): void {
    if (!scrollBox) {
      return
    }
    const pending = getVisibleItems(scrollBox, (item) => item.flashPending === true)
    for (const visibleItem of pending) {
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
    watch(bubbleListItems, async (list) => {
      if (list.length === 0) {
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
    domainItems,
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
