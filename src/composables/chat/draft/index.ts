/**
 * IM / Agent 未发送草稿的本机持久化。
 * 内存 `draft` 仍是会话上的活槽；刷新后从这里 hydrate。发送时机不变（点发送才 upload）。
 */
export {DraftDatabase, draftDatabase} from './draftDatabase.ts'
export {
  DraftBlobTooLargeError,
  clearDraft,
  clearPrincipal,
  getDraft,
  putDraft,
} from './draftRepository.ts'
export {createImDraftCodec, type ImDraftLive} from './imDraftCodec.ts'
export {createAgentDraftCodec, type AgentDraftLive} from './agentDraftCodec.ts'
export type {RestoreDraftSlotFactories} from './persistableSlots.ts'
