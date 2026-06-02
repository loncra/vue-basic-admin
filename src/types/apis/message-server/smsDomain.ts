import type {
  BasicMessageEntity,
  IdNameValueMetadata,
  NameValueEnumMetadata,
  StringIdEntity
} from "@/types/apis";

/**
 * 短信消息实体
 *
 * @author maurice.chen
 */
export interface SmsMessageEntity extends BasicMessageEntity {
    /**
     * 渠道名称
     */
    channel: NameValueEnumMetadata<string> | string;

    /**
     * 手机号码
     */
    phoneNumber: string;

    /**
     * 元数据信息
     */
    metadata: Record<string, unknown>;

    /**
     * 收信人
     */
    principal: string;

    /**
     * 批量消息 id
     *
     */
    batchId:number

    /**
     * 状态
     *
     */
    executeStatus: NameValueEnumMetadata<number> | number;
}

export interface SmsMessageSendPayloadMetadata {
  signCode:string,
  templateCode: string,
  variables: IdNameValueMetadata<string>[]
}

/**
 * 短息消息发送体
 *
 * @author maurice.chen
 */
export interface SmsMessageSendPayload  {
  /**
   * 发送渠道
   */
  channel: NameValueEnumMetadata<string> | string
  /**
   * 手机号码
   */
  phoneNumbers:string[]
  /**
   * 元数据信息
   */
  metadata: SmsMessageSendPayloadMetadata
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
   * 备注
   */
  remark?: string;
}

/**
 * 短信模板保存请求体
 *
 * @author maurice.chen
 */
export interface SmsTemplatePayload extends StringIdEntity {
    /**
     * 渠道名称
     */
    channel: NameValueEnumMetadata<string> | string;

    /**
     * 名称
     */
    name: string;

    /**
     * 内容
     */
    content: string;

    /**
     * 类型
     */
    type: NameValueEnumMetadata<number> | number;

    /**
     * 额外元数据信息
     */
    metadata?: Record<string, unknown>;

    /**
     * 备注
     */
    remark?: string;
}

/**
 * 短信模板实
 *
 * @author maurice.chen
 */
export interface SmsTemplateEntity extends SmsTemplatePayload {
    /**
     * 审核状态
     */
    status: NameValueEnumMetadata<number> | number;

    /**
     * 审核时间
     */
    auditionTime: number;
}

/**
 * 短信签名保存请求体
 *
 * @author maurice.chen
 */
export interface SmsSignPayload extends StringIdEntity {
    /**
     * 渠道名称
     */
    channel: NameValueEnumMetadata<string> | string;

    /**
     * 签名名称
     */
    name: string;

    /**
     * 额外元数据信息
     */
    metadata?: Record<string, unknown>;

    /**
     * 备注
     */
    remark?: string;
}

/**
 * 短信签名实体
 *
 * @author maurice.chen
 */
export interface SmsSignEntity extends SmsSignPayload {
    /**
     * 审核状态
     */
    status: NameValueEnumMetadata<number> | number;
    /**
     * 审核时间
     */
    auditionTime: number;
}
