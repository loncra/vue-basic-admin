import type {Ref} from 'vue'
import type {UserChatMessageEntity, UserChatMessageResponseBody,} from '@/types/apis'
import type {ChatBubbleItem, ConversationActiveProps} from '@/types/composables'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {useMessageServerStore} from '@/stores/messageServerStore.ts'
import {getEnumValue} from '@/utils'

/**
 * 可见消息已读上报队列。
 * 从 ChatBubbleList 拆出：收集可见未读 -> 批量提交 -> 刷新未读数；
 * 切换会话时 reset()。
 */
export function useChatReadMarker(conversation: Ref<ConversationActiveProps>) {
  const principalStore = usePrincipalStore()
  const messageServerStore = useMessageServerStore()

  const readingSet = new Set<number>()
  const sentIds = new Set<number>()
  let readProcessing = false

  function isReadableMessage(
    message: UserChatMessageResponseBody | UserChatMessageEntity | undefined,
  ): boolean {
    if (!message || getEnumValue(message.type) === 20) {
      return false
    }
    const readable = (message as UserChatMessageResponseBody).readable
    if (readable === undefined) {
      return false
    }
    return getEnumValue(readable) === 1 && message.principal !== principalStore.state.name
  }

  /** 将一批可见的可读消息纳入已读队列并触发提交 */
  function markVisible(items: ChatBubbleItem[]): void {
    if (items.length <= 0) {
      return
    }
    for (const data of items.map((i) => i.data)) {
      if (!data) {
        continue
      }
      const id = Number(data.id)
      // sentIds 拦截已提交但本地 readable 尚未被 socket 回包更新的消息，避免重复提交
      if (!sentIds.has(id)) {
        readingSet.add(id)
      }
      if (id === conversation.value.dataSource?.metadata?.readableAnchorId) {
        delete conversation.value.dataSource?.metadata?.readableAnchorId
      }
    }
    void flushReadQueue()
  }

  async function flushReadQueue(): Promise<void> {
    if (readProcessing || readingSet.size === 0) {
      return
    }
    readProcessing = true
    try {
      // while 循环：await 期间新收集的 ID 由下一轮批次带走
      while (readingSet.size > 0) {
        const batch = Array.from(readingSet)
        readingSet.clear()
        try {
          await ChatMessageService.readMessage(batch)
          batch.forEach((id) => sentIds.add(id))
          await messageServerStore.fetchUnreadQuantity()
        } catch (error) {
          console.error('标记已读失败:', error)
          // 丢弃本批：本地 readable 仍为未读，下次滚动会重新收集，避免服务端故障时无限重试
          break
        }
      }
    } finally {
      readProcessing = false
    }
  }

  function reset(): void {
    readingSet.clear()
    sentIds.clear()
  }

  return {isReadableMessage, markVisible, reset}
}

export type ChatReadMarkerApi = ReturnType<typeof useChatReadMarker>
