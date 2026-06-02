import type {IdNameMetadata, NameValueEnumMetadata, VersionEntityMetadata} from "../common";

/**
 * 基础消息实体，用于将所有消息内容公有化使用。
 *
 * @author maurice.chen
 */
export interface BasicMessageEntity extends VersionEntityMetadata {
  /**
   * 类型
   *
   * @see MessageTypeEnum
   */
  type: NameValueEnumMetadata<number> | number;

  /**
   * 内容
   */
  content: string;

  /**
   * 重试次数
   */
  retryCount?: number;

  /**
   * 最大重试次数
   */
  maxRetryCount?: number;

  /**
   * 异常信息
   */
  exception?: string;

  /**
   * 发送成功时间
   */
  successTime?: number;

  /**
   * 状态：0.执行中、1.执行成功，2.重试中，99.执行失败
   *
   * @see ExecuteStatus
   */
  executeStatus?: NameValueEnumMetadata<number> | number;

  /**
   * 重试时间
   */
  retryTime?: number;

  /**
   * 备注
   */
  remark: string;
}

export interface BatchResponse {
  /**
   * 批量消息 id
   *
   */
  batchId: number
  /**
   * 数量
   */
  count: number
}

export interface MyMessageState {
  record?:Record<number, number> | undefined
  siteTypes?:IdNameMetadata[]
}
