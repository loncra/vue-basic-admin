import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import type {ObjectWriteResult} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";

export type AttachmentUploadMode = typeof ATTACHMENT_UPLOAD_MODE.PICTURE_CARD | typeof ATTACHMENT_UPLOAD_MODE.DRAGGER
export type AttachmentPreviewMode = typeof ATTACHMENT_PREVIEW_MODE.PICTURE_CARD | typeof ATTACHMENT_PREVIEW_MODE.LIST

export type AttachmentFileItem = UploadFile<ObjectWriteResult> | ObjectWriteResult

/**
 * @deprecated
 */
export type AttachmentDisplayUploadFile = UploadFile<ObjectWriteResult> & {
  objectWriteResult?: ObjectWriteResult
}

export type AttachmentValue =
  | AttachmentFileItem
  | AttachmentFileItem[]
  | undefined

export interface AttachmentUploadExecutorOptions {
  postFilename: string
  promiseLimit: number
  param?: Record<string, unknown>
  headers?: Record<string, string>
}
