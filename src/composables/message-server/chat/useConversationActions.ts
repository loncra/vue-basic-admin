import {deleteImConversations, muteImConversations, pinImConversations} from '@loncra/antdv-chat-pro'
import useApp from 'antdv-next/dist/app/useApp'
import type {BasicUserChatConversation} from '@loncra/client/message'
import {useMessageServerStore} from '@/stores/messageServerStore.ts'

/**
 * 会话列表右键菜单的置顶、免打扰和删除。
 * 仅负责发请求与统一副作用（未读刷新 / 错误提示），本地状态由调用方按返回结果应用。
 */
export function useConversationActions() {
  const {message} = useApp()
  const messageServerStore = useMessageServerStore()

  async function togglePinned(ids: number[]): Promise<BasicUserChatConversation[]> {
    return pinImConversations(ids)
  }

  async function toggleMuted(ids: number[]): Promise<BasicUserChatConversation[]> {
    const data = await muteImConversations(ids)
    data.forEach(d => messageServerStore.setUserChatMessageMutedValue(Number(d.id), d.muted))
    return data
  }

  async function removeConversations(ids: number[]): Promise<boolean> {
    try {
      const result = await deleteImConversations(ids)
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
