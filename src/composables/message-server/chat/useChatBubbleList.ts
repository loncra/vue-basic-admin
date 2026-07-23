import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  type Ref,
  ref,
  watch,
} from 'vue'
import type {
  BubbleListProps,
  ChatBubbleItem,
  ChatBubbleListCallbacks,
  ChatContentBlock,
  UserChatConversationActiveProps,
} from '@/types/composables'
import type {RestResult, UserChatMessageResponseBody} from '@/types/apis'
import type {MenuItemType} from 'antdv-next'
import {Space, StatisticTimer} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {createIcon, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {CHAT_BUBBLE_TYPE} from '@/constants'
import {useChatReadMarker} from '@/composables/message-server/chat/useChatReadMarker.ts'
import {DEFAULT_BUBBLE_LIST_ROLE} from '@/composables/chat/useBubbleList.ts'

const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000
const UNDO_NOT_UNDONE = 0
const MENU_KEY_REFERENCE = 'reference'
const MENU_KEY_UNDO = 'undo'

/**
 * IM 气泡列表业务层：已读上报、撤回/引用/重编辑、右键菜单。
 * session 直接为 UserChatConversationActiveProps（ActiveChatSession 子类型）。
 */
export function useChatBubbleList(
  conversation: Ref<UserChatConversationActiveProps>,
  props: BubbleListProps,
  callbacks: ChatBubbleListCallbacks,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const {message, modal} = useApp()
  const readMarker = useChatReadMarker(conversation)

  const listProps = computed(() => ({
    scrollToBottomThreshold: props.scrollToBottomThreshold,
    throttleOnScrollWait: props.throttleOnScrollWait,
    throttleCollectVisibleWait: props.throttleCollectVisibleWait ?? 500,
    topThreshold: props.topThreshold,
    timeDividerGap: props.timeDividerGap ?? TIME_DIVIDER_GAP_MS,
  }))

  function isActiveForRead(): boolean {
    return document.visibilityState === 'visible' && document.hasFocus()
  }

  function onVisibleItems(items: ChatBubbleItem[]): void {
    if (!isActiveForRead()) {
      return
    }
    const readable = items.filter((item) =>
      readMarker.isReadableMessage(item?.data as UserChatMessageResponseBody),
    )
    readMarker.markVisible(readable)
  }

  function reedit(item: UserChatMessageResponseBody): void {
    conversation.value.dataSource.elements = conversation.value.dataSource.elements.filter(
      (d) => d.key !== String(item.id),
    )
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

  function createMessageMenu(item: ChatBubbleItem, role: string): MenuItemType[] {
    const data = item.data as UserChatMessageResponseBody
    const items: MenuItemType[] = []
    if (getEnumValue(data?.undo) === UNDO_NOT_UNDONE) {
      items.push({
        key: MENU_KEY_REFERENCE,
        label: globalProperties.$t('chat.view.reference'),
        icon: createIcon('loncra-text-quote', 'text-lg'),
      })

      if (
        role === CHAT_BUBBLE_TYPE.USER &&
        globalProperties
          .$dayjs()
          .isBefore(
            globalProperties.$dayjs((item?.data as UserChatMessageResponseBody)?.undoableTime),
          )
      ) {
        const disabled = ref(false)
        const timer = h(StatisticTimer, {
          classes: {
            content: 'text-DEFAULT text-text-secondary',
          },
          onFinish: () => (disabled.value = true),
          type: 'countdown',
          value: (item?.data as UserChatMessageResponseBody)?.undoableTime,
          format: globalProperties.$t('chat.view.undo.countdown'),
        })
        const label = h(Space, {}, [globalProperties.$t('chat.view.undo.action'), timer])
        items.push({
          key: MENU_KEY_UNDO,
          label: label,
          icon: createIcon('loncra-undo', 'text-lg'),
          danger: true,
          disabled: disabled.value,
        })
      }
    }

    return items
  }

  function onMessageMenuClick(e: {key: string}, item: ChatBubbleItem): void {
    const data = item.data as UserChatMessageResponseBody
    if (e.key === MENU_KEY_REFERENCE) {
      addRefMessage(data)
    } else if (e.key === MENU_KEY_UNDO) {
      onUndoMessage(data)
    }
  }

  function onLoadPage(tag: 'next' | 'previous', scrollBox: HTMLElement): void {
    callbacks.onLoadPage(tag, scrollBox)
  }

  function onReloadLastPage(): void {
    callbacks.onReloadLastPage()
  }

  watch(
    () => conversation.value.item?.key,
    () => readMarker.reset(),
  )

  return {
    session: conversation,
    listProps,
    bubbleListRole: DEFAULT_BUBBLE_LIST_ROLE,
    onVisibleItems,
    reedit,
    createMessageMenu,
    onMessageMenuClick,
    onLoadPage,
    onReloadLastPage,
  }
}

export type ChatBubbleListApi = ReturnType<typeof useChatBubbleList>
