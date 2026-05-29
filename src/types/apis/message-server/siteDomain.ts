import type {BasicMessageEntity, NameValueEnumMetadata, ObjectWriteResult} from "@/types/apis";

export interface BasicSiteMessage {
  /**
   * 类型
   *
   * @see MessageTypeEnum
   */
  type: NameValueEnumMetadata<number> | number
  /**
   * 标题
   */
  title: string
  /**
   * 内容
   */
  content:string
  /**
   * 是否可推送的消息：0.否，1.是
   */
  pushable: NameValueEnumMetadata<number> | number
  /**
   * 附件
   */
  attachmentList: ObjectWriteResult[]
  /**
   * 元数据信息
   */
  metadata?: Record<string, unknown>
  /**
   * 封面
   */
  cover?: ObjectWriteResult,
  /**
   * 推送渠道
   */
  channels: NameValueEnumMetadata<number>[] | number[]
  /**
   * 备注
   */
  remark:string
}

/**
 * 批量消息实体
 *
 * @author maurice.chen
 */
export interface SiteMessageEntity extends BasicMessageEntity, BasicSiteMessage {

  /**
   * 收信用户
   */
  toUser: string;

  /**
   * 是否可读的：0.否，1.是
   */
  readable: NameValueEnumMetadata<number> | number;

  /**
   * 读取时间
   */
  readTime: number;

  /**
   * 批量消息 id
   */
  batchId: number;
}

/**
 * 站内信发送请求体
 *
 * @author maurice.chen
 */
export interface SiteMessageSendPayload extends BasicSiteMessage{
  /**
   * 接收方用户
   */
  toUsers: string[];
}

