import type {
  ActiveAgentConversationItem,
  AgentClarifyCard,
  AgentClarifyField,
  AgentSseMessageContent,
  AgentToolCallBlock,
  ChatBubbleItem,
} from '@/types/composables'
import type {AgentMessageEntity} from '@/types/apis'
import {
  AGENT_CHAT_STATUS,
  AGENT_CLARIFY_TOOL,
  AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
} from '@/constants'
import {getEnumValue} from '@/utils'
import {isHitlAwaiting} from '@/composables/ai-server/agent/agentHitl.ts'

export interface PendingClarifyExit {
  assistantMessageId: number
  toolCallId: string
  exitBlock: AgentToolCallBlock
  writeBlock?: AgentToolCallBlock
  card?: AgentClarifyCard
  summary?: string
}

function parseToolInput(value?: string): Record<string, unknown> | undefined {
  if (!value) {
    return undefined
  }
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : undefined
  } catch {
    return undefined
  }
}

export function parseClarifyWriteCard(block?: AgentToolCallBlock): AgentClarifyCard | undefined {
  const input = parseToolInput(block?.value)
  if (!input) {
    return undefined
  }
  const content = input.content
  if (content && typeof content === 'object') {
    return content as AgentClarifyCard
  }
  if (Array.isArray(input.fields) || typeof input.title === 'string') {
    return input as AgentClarifyCard
  }
  return undefined
}

export function parseClarifyExitSummary(block?: AgentToolCallBlock): string | undefined {
  const input = parseToolInput(block?.value)
  const summary = input?.summary
  return typeof summary === 'string' ? summary : undefined
}

export function isClarifyExitPending(block: AgentToolCallBlock): boolean {
  return block.name === AGENT_CLARIFY_TOOL.EXIT && isHitlAwaiting(block)
}

export function findClarifyWriteInGroup(
  tools: AgentToolCallBlock[],
  exitBlock: AgentToolCallBlock,
): AgentToolCallBlock | undefined {
  const sameGroup = tools.filter(t => (t.groupId || t.id) === (exitBlock.groupId || exitBlock.id))
  const fromGroup = [...sameGroup].reverse().find(t => t.name === AGENT_CLARIFY_TOOL.WRITE)
  if (fromGroup) {
    return fromGroup
  }
  return [...tools].reverse().find(t => t.name === AGENT_CLARIFY_TOOL.WRITE)
}

export function resolvePendingClarifyFromContents(
  assistantMessageId: number,
  contents: AgentSseMessageContent[],
): PendingClarifyExit | undefined {
  const tools = contents
    .filter(c => getEnumValue(c.type) === AGENT_CONTENT_TYPE.TOOL)
    .map(c => c as AgentToolCallBlock)
  const exitBlock = tools.find(isClarifyExitPending)
  if (!exitBlock) {
    return undefined
  }
  const writeBlock = findClarifyWriteInGroup(tools, exitBlock)
  return {
    assistantMessageId,
    toolCallId: exitBlock.id,
    exitBlock,
    writeBlock,
    card: parseClarifyWriteCard(writeBlock),
    summary: parseClarifyExitSummary(exitBlock),
  }
}

export function findPendingClarifyExit(
  conversation?: ActiveAgentConversationItem,
): PendingClarifyExit | undefined {
  if (!conversation?.dataSource?.elements?.length) {
    return undefined
  }
  for (let i = conversation.dataSource.elements.length - 1; i >= 0; i--) {
    const bubble = conversation.dataSource.elements[i] as ChatBubbleItem
    if (bubble.role !== CHAT_BUBBLE_TYPE.AI) {
      continue
    }
    const message = bubble.data as AgentMessageEntity | undefined
    if (getEnumValue(message?.status) !== AGENT_CHAT_STATUS.REQUEST_STOP) {
      continue
    }
    const pending = resolvePendingClarifyFromContents(
      Number(bubble.key),
      (bubble.content || []) as AgentSseMessageContent[],
    )
    if (pending) {
      return pending
    }
  }
  return undefined
}

export function isRequiredClarifyField(field: AgentClarifyField): boolean {
  return Boolean(field.required)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
