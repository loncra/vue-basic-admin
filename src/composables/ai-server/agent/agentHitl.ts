import type {AgentToolCallBlock} from '@/types/composables'
import {AGENT_HITL_AWAITING_STATUSES} from '@/constants'

/** 等待用户确认：PENDING / ASKING 且未点选 */
export function isHitlAwaiting(tool?: Pick<AgentToolCallBlock, 'hitlStatus' | 'userConfirmed'> | null): boolean {
  if (!tool || tool.userConfirmed !== undefined) {
    return false
  }
  const status = String(tool.hitlStatus || '').toLowerCase()
  return AGENT_HITL_AWAITING_STATUSES.some(s => s.toLowerCase() === status)
}

/** 将 XCard action context / formState 压成扁平 answers */
export function flattenClarifyAnswers(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw || {})) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && 'value' in (value as object)) {
      out[key] = (value as {value: unknown}).value
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value) && 'path' in (value as object)) {
      // 未解析的 path 引用，丢弃
      continue
    } else {
      out[key] = value
    }
  }
  return out
}
