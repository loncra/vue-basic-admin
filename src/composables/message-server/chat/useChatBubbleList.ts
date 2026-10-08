import {type ComponentInternalInstance, getCurrentInstance, h, type Ref, ref, watch,} from 'vue'
import type {BubbleListItem, BubbleRenderRow} from '@loncra/antdv-chat'
import type {
  ChatBubbleItem,
  ChatBubbleListCallbacks,
  ChatContentBlock,
  UserChatConversationActiveProps,
} from '@/types/composables'
import type {UserChatMessageResponseBody} from '@/types/apis'
import type {RestResult} from '@loncra/client/commons'
import type {MenuItemType} from 'antdv-next'
import {Space, StatisticTimer} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {ChatMessageService} from '@loncra/client/message'
import {requireNonNullOrUndefined} from '@/utils'
import {CHAT_BUBBLE_TYPE, YES_OR_NO_TYPE} from '@/constants'
import {useChatReadMarker} from '@/composables/message-server/chat/useChatReadMarker.ts'
import {DEFAULT_BUBBLE_LIST_ROLE} from '@/composables/chat/useBubbleList.ts'
import {textBubble} from '@loncra/chat-core'
import {renderIconFont} from '@/utils/commonUtils'
import {getEnumValue} from '@loncra/client/commons'


function getBubbleMessageTime(item: {creationTime?: number}): number {
  return item.creationTime ?? 0
}

const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000

/**
 * IM 气泡列表业务层：已读上报、撤回/引用/重编辑、右键菜单。
 * session 直接为 UserChatConversationActiveProps（ActiveChatSession 子类型）。
 */
export function useChatBubbleList(
  conversation: Ref<UserChatConversationActiveProps>,
  callbacks: ChatBubbleListCallbacks,
) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const {message, modal} = useApp()
  const readMarker = useChatReadMarker(conversation)

  function buildBubbleListWithDividers(
    messages: BubbleListItem[]
  ): BubbleRenderRow[] {
    const sorted = [...messages.filter((s) => !s.hide)].sort(
      (a, b) => getBubbleMessageTime(a) - getBubbleMessageTime(b),
    )
    const result: BubbleRenderRow[] = []
    let lastDividerTime = 0
    for (const msg of sorted) {
      const msgTime = getBubbleMessageTime(msg)
      const needDivider =
        result.length === 0 || (msgTime > 0 && msgTime - lastDividerTime >= TIME_DIVIDER_GAP_MS)
      if (needDivider && msgTime > 0) {
        const divider = textBubble(
          `divider-${String(msg.key)}-${msgTime}`,
          globalProperties.$dayjs(msgTime).fromNow(),
          'divider',
        )
        result.push({bubble: divider})
        lastDividerTime = msgTime
      }
      result.push({
        bubble: msg,
        rootClass: 'rounded-lg ' + (msg.flashPending ? 'bg-flash' : ''),
      })
    }
    return result
  }

  function isActiveForRead(): boolean {
    return document.visibilityState === 'visible' && document.hasFocus()
  }

  function onVisibleItems(items: ChatBubbleItem[]): void {
    if (!isActiveForRead()) {
      return
    }
    const readable = items.filter((item) =>
      'readable' in item && readMarker.isReadableMessage(item),
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
    if (!('undo' in item)) {
      return []
    }
    const items: MenuItemType[] = []
    if (getEnumValue(item.undo) === YES_OR_NO_TYPE.NO) {
      items.push({
        key: "reference",
        label: globalProperties.$t('chat.view.reference'),
        icon: renderIconFont('loncra-text-quote', 'text-lg'),
      })

      if (
        role === CHAT_BUBBLE_TYPE.USER &&
        globalProperties
          .$dayjs()
          .isBefore(globalProperties.$dayjs(item.undoableTime))
      ) {
        const disabled = ref(false)
        const timer = h(StatisticTimer, {
          classes: {
            content: 'text-DEFAULT text-text-secondary',
          },
          onFinish: () => (disabled.value = true),
          type: 'countdown',
          value: item.undoableTime,
          format: globalProperties.$t('chat.view.undo.countdown'),
        })
        // 组件的 children 走 slots（直接给数组会被 Vue 认成"非函数 default 槽"并 warn）
  const label = h(Space, {}, {
    default: () => [globalProperties.$t('chat.view.undo.action'), timer],
  })
        items.push({
          key: "undo",
          label: label,
          icon: renderIconFont('loncra-undo', 'text-lg'),
          danger: true,
          disabled: disabled.value,
        })
      }
    }

    return items
  }

  function onMessageMenuClick(e: {key: string}, item: ChatBubbleItem): void {
    if (!('undo' in item)) {
      return
    }
    if (e.key === "reference") {
      addRefMessage(item)
    } else if (e.key === "undo") {
      onUndoMessage(item)
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
    buildBubbleListWithDividers,
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
