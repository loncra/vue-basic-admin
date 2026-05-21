import {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from "@/constants/systemConstant.ts";

export type AttachmentUploadMode = typeof ATTACHMENT_UPLOAD_MODE.PICTURE_CARD | typeof ATTACHMENT_UPLOAD_MODE.DRAGGER
export type AttachmentPreviewMode = typeof ATTACHMENT_PREVIEW_MODE.PICTURE_CARD | typeof ATTACHMENT_PREVIEW_MODE.LIST
