import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {AgentDraftRecord, DraftCodec} from '@/types/composables/chat/draft.ts'
import {draftRecordId} from '@/types/composables/chat/draft.ts'
import {
  collectBlobsFromSlotConfig,
  persistableToSlotConfig,
  type RestoreDraftSlotFactories,
  slotConfigToPersistable,
} from './persistableSlots.ts'

export type AgentDraftLive = SlotConfigType[]

/** Agent：槽即可（点名芯片在 slots 里）。无 refMessages。 */
export function createAgentDraftCodec(
  factories: RestoreDraftSlotFactories,
): DraftCodec<AgentDraftLive, AgentDraftRecord> {
  return {
    scope: 'agent',
    toRecord(live, ctx) {
      return {
        version: 1,
        scope: 'agent',
        id: draftRecordId(ctx.principal, ctx.targetId),
        principal: ctx.principal,
        targetId: ctx.targetId,
        updatedAt: Date.now(),
        slots: slotConfigToPersistable(live),
      }
    },
    collectBlobs(live) {
      return collectBlobsFromSlotConfig(live)
    },
    fromRecord(record, blobs) {
      return persistableToSlotConfig(record.slots, blobs, factories)
    },
  }
}
