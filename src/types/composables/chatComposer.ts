import type {DraftFilesBlock, DraftMediaBlock} from '@/types/apis/message-server/chatDomain'

export type ImSlotKind = 'image' | 'video' | 'files'

export type ImCustomSlotValue = DraftMediaBlock | DraftFilesBlock
