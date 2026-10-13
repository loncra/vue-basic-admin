import type {AgentSession} from '@loncra/antdv-chat-pro'
import {CHAT_BUBBLE_TYPE, STREAM_RUNNING_STATUS_VALUE} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'

export function getConversationRuns(conversation: AgentSession) {
  return conversation.dataSource.elements.filter((item) => {
    if (item.role !== CHAT_BUBBLE_TYPE.AI) {
      return false
    }
    const status = (item as {status?: unknown}).status
    if (status == null) {
      return false
    }
    return STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(status as number))
  })
}
