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
   * 附件
   */
  attachmentList: ObjectWriteResult[]
  /**
   * 元数据信息
   */
  metadata?: Record<string, unknown>
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
export interface EmailMessageEntity extends BasicMessageEntity, BasicSiteMessage {

  /**
   * 收信邮箱
   */
  toEmail: string

  /**
   * 批量消息 id
   */
  batchId: number

  /**
   * 发送邮箱
   */
  fromEmail:string
}

/**
 * 邮箱发送请求体
 *
 * @author maurice.chen
 */
export interface EmailMessageSendPayload extends BasicSiteMessage{
  /**
   * 接收方用户
   */
  toEmails: string[];
}

