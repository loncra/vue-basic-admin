import type {ObjectWriteResult} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";

export type TextSegment =
  | { type: 'plain'; text: string }
  | { type: 'mention'; value: string; label: string }
  | { type: 'emoji'; value: string; label: string }

export interface TextSegmentContentBlock {
  type: 'custom',
  slotKind: 'textSegment',
  segments: TextSegment[]
}

export interface AttachmentBlock {
  type: 'custom',
  slotKind: 'files',
  files: ObjectWriteResult[]
}

export interface TextBlock {
  type: 'text',
  value: string
}

export type ChatContentBlock =
  | TextSegmentContentBlock
  | AttachmentBlock
  | TextBlock

export type FilesSlotProps = {
  slotKind: 'files'
  defaultValue: UploadFile<ObjectWriteResult>[]
}

export type CursorContext = {
  slotIdx: number
  textOffset: number
  isAtLineStart: boolean
}
