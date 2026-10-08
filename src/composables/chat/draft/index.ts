/**
 * IM / Agent 未发送草稿的本机持久化。
 * 库表在 `@loncra/chat-core/dexie`。内存 `draft` 仍是会话上的活槽。
 */
import {
  clearPrincipalDrafts,
  dexieDraftStore,
} from '@loncra/chat-core/dexie'
import type {DraftRecord, DraftScope} from '@/types/composables/chat/draft.ts'

export {
  DraftBlobTooLargeError,
  DraftDatabase,
  dexieDraftStore,
  draftDatabase,
} from '@loncra/chat-core/dexie'
export {createImDraftCodec, type ImDraftLive} from './imDraftCodec.ts'
export {createAgentDraftCodec, type AgentDraftLive} from './agentDraftCodec.ts'
export type {RestoreDraftSlotFactories} from './persistableSlots.ts'

export function putDraft(record: DraftRecord, blobs?: Map<string, File>): Promise<void> {
  return dexieDraftStore.put(record, blobs)
}

export function getDraft(
  scope: DraftScope,
  principal: string,
  targetId: string,
): ReturnType<typeof dexieDraftStore.get> {
  return dexieDraftStore.get(scope, principal, targetId)
}

export function clearDraft(scope: DraftScope, principal: string, targetId: string): Promise<void> {
  return dexieDraftStore.clear(scope, principal, targetId)
}

export function clearPrincipal(principal: string): Promise<void> {
  return clearPrincipalDrafts(principal)
}
