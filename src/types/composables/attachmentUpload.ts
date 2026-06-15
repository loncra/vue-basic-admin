import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";
import type {CSSProperties} from 'vue'
import type {ObjectWriteResult} from "@/types/apis";
import type {UploadFile} from "antdv-next/dist/upload/interface";
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

export type AttachmentUploadExpose = {
  upload: () => Promise<ObjectWriteResult | ObjectWriteResult[] | undefined>
}

export interface AttachmentUploadExecutorOptions {
  postFilename: string
  promiseLimit: number
  param?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface BasicAttachmentProps {
  multiple?: boolean
  preview?:boolean
  accept?:string
  maxCount?:number
}

/** classes/styles 函数回调可读取的 props 上下文 */
export interface AttachmentSemanticContextProps {
  mode?: AttachmentUploadMode | AttachmentPreviewMode
  preview?: boolean
  maxCount?: number
  multiple?: boolean
}

/** LAttachmentUpload 语义节点 */
export interface AttachmentUploadSemanticClassNames {
  container?: string
  list?: string
  item?: string
  trigger?: string
  meta?: string
}

export interface AttachmentUploadSemanticStyles {
  container?: CSSProperties
  list?: CSSProperties
  item?: CSSProperties
  trigger?: CSSProperties
}

/** 对外：支持 object | function */
export type AttachmentUploadClassNamesType = SemanticClassNamesType<
  AttachmentSemanticContextProps,
  AttachmentUploadSemanticClassNames
>

export type AttachmentUploadStylesType = SemanticStylesType<
  AttachmentSemanticContextProps,
  AttachmentUploadSemanticStyles
>

/** 对内：merge 后的 plain object */
export type AttachmentUploadResolvedClassNames = Readonly<AttachmentUploadSemanticClassNames>
export type AttachmentUploadResolvedStyles = Readonly<AttachmentUploadSemanticStyles>

export interface AttachmentUploadPublicDomProps {
  classes?: AttachmentUploadClassNamesType
  styles?: AttachmentUploadStylesType
}

export interface AttachmentUploadDomProps {
  classes?: AttachmentUploadResolvedClassNames
  styles?: AttachmentUploadResolvedStyles
}

export interface AttachmentUploadProps extends BasicAttachmentProps, AttachmentUploadPublicDomProps {
  mode?:AttachmentUploadMode
  postFilename?:string
  autoUpload?:boolean
  showFilename?:boolean
  action?:string
  promiseLimit?:number
  bucket?:string
  uploadOptions?:Record<string, unknown>
  previewMode?:AttachmentPreviewMode
}

export interface AttachmentPreviewProps extends AttachmentUploadDomProps {
  mode?: AttachmentPreviewMode
  changeThumbUrl?: boolean
  showFilename?:boolean
  preview?:boolean
  height?:string
  width?:string,
}

export interface AttachmentPreviewFileProps {
  file: UploadFile
  border?:boolean
  enabledDelete?:boolean
  enabledDownload?:boolean
  showProgress?:boolean
  itemClass?: string
  itemStyle?: CSSProperties
}

export interface AttachmentDraggerUploadProps extends AttachmentPreviewProps, BasicAttachmentProps {
}

export interface AttachmentPictureCardUploadProps extends AttachmentPreviewProps, BasicAttachmentProps {
}
