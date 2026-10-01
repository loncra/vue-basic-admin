import type {UserChatMessageResponseBody} from '@/types/apis'
import type {DraftRecordBase} from '@loncra/chat-core'

/**
 * 草稿形状 —— **不再重复定义**（2026-10-01 S2a-B）：
 * - **契约/基座**来自规范包 `@loncra/chat-core`（这里只是再导出，保住宿主既有 import 路径）；
 * - 本文件只留**域的记录形状**（IM 的 `refMessages`、Agent 的空扩展）—— S3/S4 随域迁入实现包。
 *
 * 本机草稿入库形状（可 JSON 克隆）：Sender 活槽带 `customRender` / `originFileObj`，不能整段进 IndexedDB；
 * File 本体进 `blobs` 表，只留元数据；点名芯片只留 prefix + id/value。
 */
export type {
  DraftBlobRow,
  DraftCodec,
  DraftRecordBase,
  PersistableSlot,
  PersistableUploadFile,
} from '@loncra/chat-core'
export {draftBlobId, draftRecordId} from '@loncra/chat-core'

/** IM 引用条只挂在本记录上，禁止塞进公共信封。 */
export interface ImDraftRecord extends DraftRecordBase {
  scope: 'im'
  refMessages: UserChatMessageResponseBody[]
}

export interface AgentDraftRecord extends DraftRecordBase {
  scope: 'agent'
}

export type DraftRecord = ImDraftRecord | AgentDraftRecord

export type DraftScope = DraftRecord['scope']
