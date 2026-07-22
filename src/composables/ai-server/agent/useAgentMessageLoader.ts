import {type ComponentInternalInstance, getCurrentInstance, nextTick, ref, type Ref} from "vue";
import type {ActiveAgentConversationItem, AgentViewController} from "@/types/composables";
import {addBubbleListMessage, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AGENT_CONVERSATION_TYPE, CHAT_BUBBLE_TYPE} from "@/constants";
import {AgentService} from "@/apis";
import type {
  AgentMessageEntity,
  PageResult,
  RestResult,
  UserChatMessageResponseBody
} from "@/types/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";


export function useAgentMessageLoader(
  view:Ref<AgentViewController | undefined>
) {

  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const conversationActive = ref<ActiveAgentConversationItem>()

  async function loadPage(
    number: number,
    append: boolean = false,
    clear: boolean = false,
  ): Promise<void> {
    if (!conversationActive.value) {
      return
    }
    const active = conversationActive.value
    if (active.loading) {
      return
    }
    try {
      active.loading = true
      const result: RestResult<PageResult<AgentMessageEntity>> =
        await AgentService.histories({number}, Number(active.id))
      if (!result.data) {
        return
      }
      if (!active.isOnFirstPage) {
        active.isOnFirstPage = active.dataSource.first
      }
      if (!active.isOnLastPage) {
        active.isOnLastPage = active.dataSource.last
      }
      if (clear) {
        active.dataSource.elements = []
      }
      result.data.elements.forEach( d=> addBubbleListMessage(d, CHAT_BUBBLE_TYPE.USER, active.dataSource.elements, !append))
    } finally {
      active.loading = false
    }
  }

  async function positioningMessage(messageId: number): Promise<void> {
    const active = conversationActive.value
    if (!active) {
      return
    }
    try {
      active.loading = true
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        Number(active.id),
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

  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const active = conversationActive.value
    if (!active) {
      return
    }
    active.isOnLastPage = false
    active.isOnFirstPage = false
    active.loading = true
    try {
      await loadPage(pageNumber, false, true)

      if (active.dataSource.elements.length <= 0) {
        return
      }

      const anchorIndex = active.dataSource.elements.findIndex((b) => b.key === String(messageId))
      let key

      if (anchorIndex < 0) {
        key = active.dataSource.elements.at(0)?.key
      } else {
        const anchorBubble = active.dataSource.elements[anchorIndex]
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
          active.dataSource.elements.splice(anchorIndex, 0, newBubble)
        }
      }

      await nextTick()
      if (!view.value) {
        return
      }
      //view.value.jumpToMessage(String(key))
    } finally {
      active.loading = false
    }
  }

  async function switchConversation(
    conversation: Ref<ActiveAgentConversationItem | undefined>,
    messageId?: number,
    reload: boolean = false,
  ) {
    if (!conversation.value || getEnumValue(conversation.value.type) !== AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION) {
      return;
    }

    if (!messageId) {
      await loadPage(1, false, reload)
      await nextTick()
      //view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } else {
      await positioningMessage(messageId)
    }

  }
  return {
    switchConversation
  }
}
