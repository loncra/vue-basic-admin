import type {IdValueMetadata, NameValueEnumMetadata} from "@/types/apis/common";

export type EnumBucketsResponseBody = Record<string, Record<string, NameValueEnumMetadata<number | string>[]>>

export type EnumBucketsRequestBody = Record<string, {
  id:string,
  value?: string[],
}[]>


export interface ExportDataMetadata {
  /**
   * 主键 id
   */
  id: string

  /**
   * 创建时间
   */
  creationTime: number;

  /**
   * 文件名称
   */
  filename: string;

  /**
   * 状态
   */
  executeStatus: NameValueEnumMetadata<number>;

  /**
   * 异常信息
   */
  exception: string;

  /**
   * 成功时间
   */
  successTime: number;

  /**
   * 最后导出时间
   */
  retryTime: number;

  /**
   * 重试次数
   */
  retryCount: number;

  /**
   * 最大重试次数
   */
  maxRetryCount: number;

  /**
   * 导出类型
   */
  type: NameValueEnumMetadata<number>;

  /**
   * 文件大小
   */
  size: number;

  /**
   * 元数据信息
   */
  metadata: Record<string, unknown>;
}

export interface FileObject {
  bucketName:string
  objectName:string
  extraHeaders?: Record<string, string>
}

export interface ObjectWriteResult extends FileObject{
  etag:string
}

export interface MultipartUploadInitData {
  uploadId: string
  chunk: number
  uploadBlockSize: number
}

export interface MultipartUploadPartData {
  etag: string
  partNumber: number
}

export interface CompleteMultipartUploadBody {
  uploadId: string
  parts: IdValueMetadata<string, number>[]
}
