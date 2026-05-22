export interface CropperOutputScale {
  scale: number
  quality?: number
  suffix?: string
}

export interface CropperOutputResult {
  scale: number
  width: number
  height: number
  blob: Blob
  dataUrl: string
  suffix?: string
}

export interface CropperModalItem {
  uid: string
  name: string
  type: string
  preview?: string
  cropImg?: string
  blob?: Blob
  outputs?: CropperOutputResult[]
  selected: boolean
  cutting: boolean
  originFileObj?: File
}

export interface CropperModalProps {
  aspectRatio?: number
  compressQuality?: number
  outputMimeType?: string
  outputScales?: CropperOutputScale[]
  title?: string
  width?: string | number
}

export interface CropperModalCropPayload {
  item: CropperModalItem
  blob: Blob
  dataUrl: string
  outputs?: CropperOutputResult[]
}

export interface CropperModalCroppedFile {
  uid: string
  file: File
  scale: number
}
