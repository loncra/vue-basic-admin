import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import type {CSSProperties} from 'vue'
import type {ObjectWriteResult} from "@/types/apis";
import type {
  UploadClassNamesType,
  UploadFile,
  UploadStylesType,
} from "antdv-next/dist/upload/interface";
import type {
  SemanticClassNamesType,
  SemanticStylesType,
} from 'antdv-next/dist/_util/hooks/useMergeSemantic'

export type AttachmentUploadMode = typeof ATTACHMENT_UPLOAD_MODE.PICTURE_CARD | typeof ATTACHMENT_UPLOAD_MODE.DRAGGER | typeof ATTACHMENT_UPLOAD_MODE.CUSTOMIZE
export type AttachmentPreviewMode = typeof ATTACHMENT_PREVIEW_MODE.PICTURE_CARD | typeof ATTACHMENT_PREVIEW_MODE.LIST

export type AttachmentFileItem = UploadFile<ObjectWriteResult> | ObjectWriteResult

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

/** LAttachmentUpload 自身语义节点 */
export interface AttachmentUploadSemanticClassNames {
  preview?: string
  list?: string
  item?: string
  trigger?: string
}
export interface AttachmentUploadSemanticStyles {
  preview?: CSSProperties
  list?: CSSProperties
  item?: CSSProperties
  trigger?: CSSProperties
}

export interface BasicAttachmentProps {
  multiple?: boolean
  preview?:boolean
  accept?:string
  maxCount?:number
}

export interface AttachmentUploadProps extends BasicAttachmentProps {
  mode?:AttachmentUploadMode
  postFilename?:string
  autoUpload?:boolean
  action?:string
  promiseLimit?:number
  bucket?:string
  uploadOptions?:Record<string, unknown>
  previewMode?:AttachmentPreviewMode
}

export interface AttachmentPreviewProps {
  mode?: AttachmentPreviewMode
  changeThumbUrl?: boolean
  preview?:boolean
  height?:string
  width?:string,
}

export interface AttachmentPreviewFileProps {
  file: UploadFile
  height?:string
  width?:string
  enabledDelete?:boolean
  enabledDownload?:boolean
}

export interface AttachmentDraggerUploadProps extends AttachmentPreviewProps, BasicAttachmentProps {
}

export interface AttachmentPictureCardUploadProps extends AttachmentPreviewProps, BasicAttachmentProps{
}
