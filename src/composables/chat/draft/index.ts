/**
 * IM / Agent 未发送草稿的本机持久化。
 * 内存 `draft` 仍是会话上的活槽；刷新后从这里 hydrate。发送时机不变（点发送才 upload）。
 *
 * ⚠️ 2026-10-01（S2a-B）：**共享层已搬进 `@loncra/antdv-chat`**
 * （Dexie 库 / 仓库 / 槽转换），这里只是**门面**：
 * - 共享件从实现包再导出（消费方 `@/composables/chat/draft` 的 import 都不用改）；
 * - **域 codec 暂留此处**（`imDraftCodec` / `agentDraftCodec`，因域记录 `ImDraftRecord` 还住宿主 types），
 *   S3/S4 随域迁入实现包后，这个门面即可删除。
 */
export {
  DraftBlobTooLargeError,
  DraftDatabase,
  clearDraft,
  clearPrincipal,
  draftDatabase,
  getDraft,
  putDraft,
} from '@loncra/antdv-chat'
export type {RestoreDraftSlotFactories} from '@loncra/antdv-chat'

export {createImDraftCodec, type ImDraftLive} from './imDraftCodec.ts'
export {createAgentDraftCodec, type AgentDraftLive} from './agentDraftCodec.ts'
