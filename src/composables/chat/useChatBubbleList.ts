import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onUnmounted,
  type Ref,
  ref,
  watch,
} from 'vue'
import type {BubbleItemType, BubbleListRef, RoleType,} from '@antdv-next/x/dist/bubble/interface'
import type {ChatBubbleItem, ChatContentBlock, ConversationActiveProps,} from '@/types/composables'
import type {RestResult, UserChatMessageResponseBody} from '@/types/apis'
import {throttle} from 'lodash-es'
import useApp from 'antdv-next/dist/app/useApp'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {requireNonNullOrUndefined} from '@/utils'
import {useChatReadMarker} from '@/composables/chat/useChatReadMarker.ts'

export interface ChatBubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  throttleCollectVisibleUnreadWait: number
  topThreshold: number
  timeDividerGap: number
}

export interface ChatBubbleListCallbacks {
  onLoadPage: (tag: 'next' | 'previous', scrollBox: HTMLElement) => void
  onReedit: (content: ChatContentBlock[]) => void
  onReferenceMessage: (message: UserChatMessageResponseBody) => void
  onReloadLastPage: () => void
}

/**
 * 气泡列表视图逻辑：分隔符构建、滚动节流、可见已读收集、跳转闪烁、撤回/引用/重编辑。
 * 组合 useChatReadMarker 负责已读上报。
 */
export function useChatBubbleList(
  conversation: Ref<ConversationActiveProps>,
  props: ChatBubbleListProps,
  callbacks: ChatBubbleListCallbacks,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const {message, modal} = useApp()
  const readMarker = useChatReadMarker(conversation)

  const showScrollToBottom = ref<boolean>(false)
  const bubbleListRef = ref<BubbleListRef>()

  const bubbleListRole = {
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

  const bubbleListItems = computed(() =>
    buildBubbleListWithDividers(conversation.value.bubbleList ?? []),
  )

  // 节流后的处理函数，props.throttleOnScrollWait 内最多触发一次
  const handleThrottleBubbleScroll = throttle(throttleBubbleScroll, props.throttleOnScrollWait, {
    leading: true,
    trailing: false,
  })
  // 节流后的处理函数，props.throttleCollectVisibleUnreadWait 内最多触发一次
  const handleScrollRead = throttle(collectVisibleUnread, props.throttleCollectVisibleUnreadWait)

  function getMessageTime(item: ChatBubbleItem): number {
    return item.data?.creationTime ?? 0
  }

  function buildBubbleListWithDividers(messages: ChatBubbleItem[]): BubbleItemType[] {
    // 升序：[旧 -> 新]，配合 column-reverse 贴底
    const sorted = [...messages.filter((s) => !s.hide)].sort(
      (a, b) => getMessageTime(a) - getMessageTime(b),
    )
    const result: BubbleItemType[] = []
    let lastDividerTime = 0
    for (const msg of sorted) {
      const msgTime = getMessageTime(msg)
      const needDivider =
        result.length === 0 || (msgTime > 0 && msgTime - lastDividerTime >= props.timeDividerGap)
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

  function jumpToBottom(type: 'reloadLastPage' | 'bottom'): void {
    if (type === 'bottom') {
      bubbleListRef.value?.scrollTo({top: 'bottom'})
    } else {
      callbacks.onReloadLastPage()
    }
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
    const index = conversation.value.bubbleList.findIndex((b) => b.key === key)
    if (index < 0) {
      return
    }
    const bubble = conversation.value.bubbleList[index]
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
    if (conversation.value.loadConversationDataLock || conversation.value.loading) {
      return
    }
    const scrollBox = event.target as HTMLElement
    handleScrollRead(scrollBox)
    const {first, last} = conversation.value.dataSource
    // 滚到最上方 -> 加载更旧（number++）
    if (!last && isNearOldest(scrollBox)) {
      callbacks.onLoadPage('next', scrollBox)
    }
    // 滚到最下方 -> 加载更新（number--）
    else if (!first && isNearNewest(scrollBox)) {
      callbacks.onLoadPage('previous', scrollBox)
    }
  }

  /** column-reverse：是否靠近最旧消息一侧（视觉顶部） */
  function isNearOldest(scrollBox: HTMLElement): boolean {
    return scrollBox.scrollHeight + scrollBox.scrollTop <= scrollBox.clientHeight + props.topThreshold
  }

  /** column-reverse：是否靠近最新消息一侧（视觉底部） */
  function isNearNewest(scrollBox: HTMLElement): boolean {
    return scrollBox.scrollTop >= -props.topThreshold
  }

  function collectVisibleUnread(scrollBox: HTMLElement): void {
    const items: ChatBubbleItem[] = getVisibleChatBubbleItems(scrollBox, (item) =>
      readMarker.isReadableMessage(item?.data as UserChatMessageResponseBody),
    )
    readMarker.markVisible(items)
  }

  function onBubbleScroll(event: Event): void {
    const scrollBox = event.target as HTMLElement
    showScrollToBottom.value = scrollBox.scrollTop <= -props.scrollToBottomThreshold
    tryFlashPendingItems(scrollBox)
    handleThrottleBubbleScroll(event)
  }

  function getVisibleChatBubbleItems(
    scrollBox: HTMLElement,
    filter: (item: ChatBubbleItem) => boolean | undefined,
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
      if (!filter(item as ChatBubbleItem)) {
        continue
      }
      const element = children[i] as HTMLElement
      const rect = element.getBoundingClientRect()
      if (rect.bottom > scrollRect.top && rect.top < scrollRect.bottom) {
        items.push(item as ChatBubbleItem)
      }
    }
    return items
  }

  function tryFlashPendingItems(scrollBox: HTMLElement | undefined): void {
    if (!scrollBox) {
      return
    }
    const items = getVisibleChatBubbleItems(scrollBox, (item) => item.flashPending === true)
    for (const visibleItem of items) {
      const bubble = conversation.value.bubbleList.find(
        (b) => String(b.key) === String(visibleItem.key),
      )
      if (!bubble) {
        continue
      }
      nextTick(() => setTimeout(() => (bubble.flashPending = false), 2000))
      break
    }
  }

  function reedit(item: UserChatMessageResponseBody): void {
    conversation.value.bubbleList = conversation.value.bubbleList.filter(d => d.key !== String(item.id))
    callbacks.onReedit(item.metadata.oldContent as ChatContentBlock[])
  }

  function addRefMessage(item: UserChatMessageResponseBody): void {
    if (!item) {
      return
    }
    callbacks.onReferenceMessage(item)
  }

  function onUndoMessage(item: UserChatMessageResponseBody): void {
    modal.confirm({
      title: globalProperties.$t('chat.view.undo.confirmTitle'),
      content: globalProperties.$t('chat.view.undo.confirmContent'),
      onOk: () => doUndoMessage(Number(item.id)),
    })
  }

  function doUndoMessage(id: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const result: RestResult<void> = await ChatMessageService.undoMessage([id])
        message.success(result.message)
        resolve()
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
        reject(error)
      }
    })
  }

  // 数据变化（首屏加载、切换会话、socket 新消息、历史分页）后检查可见区未读。
  // 不能依赖 mounted：挂载时 bubbleList 尚未加载，且切换会话不会重新挂载；
  // 贴底收到新消息时 scrollTop 不变，也不会触发 scroll 事件
  watch(bubbleListItems, async (items) => {
    if (items.length === 0) {
      return
    }
    await nextTick()
    const scrollBox = bubbleListRef.value?.scrollBoxNativeElement
    if (scrollBox) {
      handleScrollRead(scrollBox)
    }
  })

  // 切换会话时重置已读队列状态
  watch(
    () => conversation.value.item?.key,
    () => readMarker.reset(),
  )

  onUnmounted(() => {
    handleScrollRead.cancel()
    handleThrottleBubbleScroll.cancel()
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
    bubbleListRole,
    showScrollToBottom,
    onBubbleScroll,
    jumpToBottom,
    jumpToMessage,
    reedit,
    addRefMessage,
    onUndoMessage,
    getScrollBox,
    scrollTo,
  }
}

export type ChatBubbleListApi = ReturnType<typeof useChatBubbleList>
