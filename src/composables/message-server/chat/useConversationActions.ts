import useApp from 'antdv-next/dist/app/useApp'
import type {BasicUserChatConversation, RestResult} from '@/types/apis'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {useMessageServerStore} from '@/stores/messageServerStore.ts'

/**
 * 会话的置顶 / 免打扰 / 删除动作。
 * 去重 ChatConversation（右键菜单）与 ChatRoomView（设置面板）中重复的接口调用与提示逻辑。
 * 仅负责发请求与统一副作用（未读刷新 / 错误提示），本地状态由调用方按返回结果应用。
 */
export function useConversationActions() {
  const {message} = useApp()
  const messageServerStore = useMessageServerStore()

  async function togglePinned(ids: number[]): Promise<BasicUserChatConversation[]> {
    const result: RestResult<BasicUserChatConversation[]> =
      await ChatMessageService.pinnedConversation(ids)
    return result.data ?? []
  }

  async function toggleMuted(ids: number[]): Promise<BasicUserChatConversation[]> {
    const result: RestResult<BasicUserChatConversation[]> =
      await ChatMessageService.mutedConversation(ids)
    const data = result.data ?? []
    data.forEach(d => messageServerStore.setUserChatMessageMutedValue(Number(d.id), d.muted))
    return data
  }

  async function removeConversations(ids: number[]): Promise<boolean> {
    try {
      const result: RestResult<void> = await ChatMessageService.deleteConversation(ids)
      message.success(result.message)
      return true
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  return {togglePinned, toggleMuted, removeConversations}
}

export type ConversationActionsApi = ReturnType<typeof useConversationActions>
