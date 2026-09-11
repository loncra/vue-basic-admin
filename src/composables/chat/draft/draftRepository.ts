import {draftDatabase} from './draftDatabase.ts'
import {
  draftBlobId,
  type DraftRecord,
  draftRecordId,
  type DraftScope,
  type ImDraftRecord,
  type PersistableSlot,
} from '@/types/composables/chat/draft.ts'

/** 单文件上限；超限整笔不写，避免半截稿。 */
const MAX_DRAFT_BLOB_BYTES = 50 * 1024 * 1024
/** QuotaExceeded 时按该用户 updatedAt LRU 删最旧稿，再重试。 */
const QUOTA_EVICT_TRIES = 8

export class DraftBlobTooLargeError extends Error {
  readonly fileUid: string
  readonly size: number

  constructor(fileUid: string, size: number) {
    super(`草稿文件超过 50MB: ${fileUid}`)
    this.name = 'DraftBlobTooLargeError'
    this.fileUid = fileUid
    this.size = size
  }
}

function isImRecord(record: DraftRecord): record is ImDraftRecord {
  return record.scope === 'im'
}

function collectFileUids(slots: PersistableSlot[]): string[] {
  const uids: string[] = []
  for (const slot of slots) {
    if (slot.type === 'custom' && slot.slotKind === 'files') {
      for (const file of slot.files) {
        uids.push(file.uid)
      }
    }
  }
  return uids
}

/** 空稿不留行：否则列表「[草稿]」和 hydrate 会当成有内容。 */
function isEmptyDraft(record: DraftRecord): boolean {
  for (const slot of record.slots) {
    if (slot.type === 'text' && slot.value.trim().length > 0) {
      return false
    }
    if (slot.type === 'custom' && slot.slotKind === 'files' && slot.files.length > 0) {
      return false
    }
    if (slot.type === 'custom' && slot.slotKind === 'instruction') {
      return false
    }
  }
  return !(isImRecord(record) && record.refMessages.length > 0)
}

function assertBlobSizes(blobs: Map<string, File>): void {
  for (const [uid, file] of blobs) {
    if (file.size > MAX_DRAFT_BLOB_BYTES) {
      throw new DraftBlobTooLargeError(uid, file.size)
    }
  }
}

async function deleteBlobsForUids(principal: string, uids: string[]): Promise<void> {
  const ids = [...new Set(uids)].map((uid) => draftBlobId(principal, uid))
  if (ids.length === 0) {
    return
  }
  await draftDatabase.blobs.bulkDelete(ids)
}

async function readRecord(
  scope: DraftScope,
  id: string,
): Promise<DraftRecord | undefined> {
  if (scope === 'im') {
    return draftDatabase.imDrafts.get(id)
  }
  return draftDatabase.agentDrafts.get(id)
}

async function writeRecord(record: DraftRecord): Promise<void> {
  if (isImRecord(record)) {
    await draftDatabase.imDrafts.put(record)
    return
  }
  await draftDatabase.agentDrafts.put(record)
}

async function deleteRecord(scope: DraftScope, id: string): Promise<void> {
  if (scope === 'im') {
    await draftDatabase.imDrafts.delete(id)
    return
  }
  await draftDatabase.agentDrafts.delete(id)
}

export async function clearDraft(
  scope: DraftScope,
  principal: string,
  targetId: string,
): Promise<void> {
  const id = draftRecordId(principal, targetId)
  await draftDatabase.transaction(
    'rw',
    draftDatabase.imDrafts,
    draftDatabase.agentDrafts,
    draftDatabase.blobs,
    async () => {
      const existing = await readRecord(scope, id)
      if (existing) {
        await deleteBlobsForUids(principal, collectFileUids(existing.slots))
      }
      await deleteRecord(scope, id)
    },
  )
}

async function evictOldestDraft(principal: string): Promise<boolean> {
  const [imRows, agentRows] = await Promise.all([
    draftDatabase.imDrafts.where('principal').equals(principal).sortBy('updatedAt'),
    draftDatabase.agentDrafts.where('principal').equals(principal).sortBy('updatedAt'),
  ])
  const oldest = [...imRows, ...agentRows].sort((a, b) => a.updatedAt - b.updatedAt)[0]
  if (!oldest) {
    return false
  }
  await clearDraft(oldest.scope, oldest.principal, oldest.targetId)
  return true
}

function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError'
  }
  return error instanceof Error && error.name === 'QuotaExceededError'
}

async function putDraftOnce(
  record: DraftRecord,
  blobs: Map<string, File>,
): Promise<void> {
  const id = draftRecordId(record.principal, record.targetId)
  const recordToWrite = {...record, id} as DraftRecord

  await draftDatabase.transaction(
    'rw',
    draftDatabase.imDrafts,
    draftDatabase.agentDrafts,
    draftDatabase.blobs,
    async () => {
      const existing = await readRecord(recordToWrite.scope, id)
      const nextUids = new Set(collectFileUids(recordToWrite.slots))
      if (existing) {
        // 用户删掉附件后，旧 blob 必须跟着删，否则配额被僵尸 File 占满。
        const stale = collectFileUids(existing.slots).filter((uid) => !nextUids.has(uid))
        await deleteBlobsForUids(recordToWrite.principal, stale)
      }
      await writeRecord(recordToWrite)
      const blobRows = [...blobs.entries()].map(([uid, file]) => ({
        id: draftBlobId(recordToWrite.principal, uid),
        principal: recordToWrite.principal,
        file,
      }))
      if (blobRows.length > 0) {
        await draftDatabase.blobs.bulkPut(blobRows)
      }
    },
  )
}

/**
 * 记录与 blobs 同一事务写入。空稿走 clearDraft，不留空行。
 * 主键需要 principal：只凭 targetId 拼不出 `{principal}:{targetId}`。
 */
export async function putDraft(
  record: DraftRecord,
  blobs: Map<string, File> = new Map(),
): Promise<void> {
  if (isEmptyDraft(record)) {
    await clearDraft(record.scope, record.principal, record.targetId)
    return
  }
  assertBlobSizes(blobs)
  let lastError: unknown
  for (let attempt = 0; attempt <= QUOTA_EVICT_TRIES; attempt++) {
    try {
      await putDraftOnce(record, blobs)
      return
    } catch (error) {
      lastError = error
      if (!isQuotaExceeded(error) || attempt === QUOTA_EVICT_TRIES) {
        throw error
      }
      const evicted = await evictOldestDraft(record.principal)
      if (!evicted) {
        throw error
      }
    }
  }
  throw lastError
}

/** 缺 blob 仍返回记录：文字 / 点名还能还原；附件芯片可能没有 File。 */
export async function getDraft(
  scope: DraftScope,
  principal: string,
  targetId: string,
): Promise<{record: DraftRecord; blobs: Map<string, File>} | undefined> {
  const id = draftRecordId(principal, targetId)
  const record = await readRecord(scope, id)
  if (!record) {
    return undefined
  }
  const uids = collectFileUids(record.slots)
  const blobs = new Map<string, File>()
  if (uids.length === 0) {
    return {record, blobs}
  }
  const rows = await draftDatabase.blobs.bulkGet(
    uids.map((uid) => draftBlobId(principal, uid)),
  )
  for (let i = 0; i < uids.length; i++) {
    const uid = uids[i]
    const row = rows[i]
    if (uid && row?.file) {
      blobs.set(uid, row.file)
    }
  }
  return {record, blobs}
}

/** 登出清该用户全部草稿，避免下一账号看到上一账号未发送文件。 */
export async function clearPrincipal(principal: string): Promise<void> {
  await draftDatabase.transaction(
    'rw',
    draftDatabase.imDrafts,
    draftDatabase.agentDrafts,
    draftDatabase.blobs,
    async () => {
      await draftDatabase.imDrafts.where('principal').equals(principal).delete()
      await draftDatabase.agentDrafts.where('principal').equals(principal).delete()
      await draftDatabase.blobs.where('principal').equals(principal).delete()
    },
  )
}
