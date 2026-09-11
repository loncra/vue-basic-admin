import type {ObjectWriteResult, UserChatMessageResponseBody} from '@/types/apis'

/**
 * 本机草稿入库形状（可 JSON 克隆）。
 *
 * Sender 活槽带 `customRender` / `originFileObj`，不能整段进 IndexedDB。
 * File 本体进 `blobs` 表，这里只留元数据；点名芯片只留 prefix + id/value。
 */
export interface PersistableUploadFile {
  uid: string
  name: string
  size: number
  type: string
  response?: ObjectWriteResult
}

export type PersistableSlot =
  | {type: 'text'; value: string}
  | {type: 'custom'; slotKind: 'files'; key: string; files: PersistableUploadFile[]}
  | {
      type: 'custom'
      slotKind: 'instruction'
      key: string
      prefix: string
      value: {id: string; value: string}
    }

export interface DraftRecordBase {
  version: 1
  principal: string
  scope: string
  /** IM = room.id；Agent = 会话 id */
  targetId: string
  updatedAt: number
  slots: PersistableSlot[]
}

/** IM 引用条只挂在本记录上，禁止塞进公共信封。 */
export interface ImDraftRecord extends DraftRecordBase {
  scope: 'im'
  id: string
  refMessages: UserChatMessageResponseBody[]
}

export interface AgentDraftRecord extends DraftRecordBase {
  scope: 'agent'
  id: string
}

export type DraftRecord = ImDraftRecord | AgentDraftRecord

export type DraftScope = DraftRecord['scope']

/** IndexedDB 可存 File；主键带 principal，登出按用户整表清。 */
export interface DraftBlobRow {
  id: string
  principal: string
  file: File
}

/**
 * 业务 live ↔ 记录。Dexie 只认记录 + blobs，不知道 IM 引用 / Agent 点名。
 */
export interface DraftCodec<TLive, TRecord extends DraftRecordBase> {
  readonly scope: TRecord['scope']
  toRecord(live: TLive, ctx: {principal: string; targetId: string}): TRecord
  collectBlobs(live: TLive): Map<string, File>
  fromRecord(record: TRecord, blobs: Map<string, File>): TLive
}

/** 同一浏览器多账号互不覆盖。 */
export function draftRecordId(principal: string, targetId: string): string {
  return `${principal}:${targetId}`
}

export function draftBlobId(principal: string, fileUid: string): string {
  return `${principal}:${fileUid}`
}
