import type {BasicIdMetadata, IdValueMetadata, NameValueEnumMetadata} from "@/types/apis/common";

export type EnumBucketsResponseBody = Record<string, Record<string, NameValueEnumMetadata<number | string>[]>>

export type EnumBucketsRequestBody = Record<string, {
  id: string,
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
  bucketName: string
  objectName: string
  extraHeaders?: Record<string, string>
}

export interface ObjectWriteResult extends FileObject {
  etag: string
  size: number
  lastModified: number
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


export interface ObjectItemInfo extends BasicIdMetadata<string> {
  /**
   * 唯一识别
   */
  id: string
  /**
   * 对象名称
   *
   */
  objectName: string

  /**
   *  ETag（去除引号）
   */
  etag: string

  /**
   * 最后修改时间
   *
   */
  lastModified: number
  /**
   * 对象大小
   *
   */
  size: number

  /**
   * 用户元数据
   *
   *
   */
  userMetadata: Record<string, string>
  /**
   * 存储类
   *
   * @return 存储类
   */
  storageClass: string

  /**
   * 判断是否为最新版本
   *
   * @return true 表示是最新版本，否则 false
   */
  latest: boolean

  /**
   * 版本 ID
   *
   * @return 版本 ID
   */
  versionId: string

  /**
   * 用户标签
   *
   * @return 用户标签
   */
  userTags: string[]

  /**
   * 判断是否为目录
   *
   * @return true 表示是目录，否则 false
   */
  dir: string
  [key:string]: unknown
}
