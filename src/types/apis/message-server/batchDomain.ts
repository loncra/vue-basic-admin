import type {NameValueEnumMetadata, VersionEntityMetadata} from "@/types/apis";

/**
 * 批量消息实体
 *
 * @author maurice.chen
 */
export interface BatchMessageEntity extends VersionEntityMetadata {
  /**
   * 完成时间
   */
  completeTime: number

  /**
   * 状态:0.执行中、1.执行成功，99.执行失败
   */
  executeStatus: NameValueEnumMetadata<number> | number

  /**
   * 总数
   */
  count: number

  /**
   * 成功发送数量
   */
  successNumber: number

  /**
   * 失败发送数量
   */
  failNumber: number
  /**
   * 发送中的数据
   */
  sendingNumber: number
  /**
   * 类型:10.站内信,20.邮件,30.短信
   */
  type: NameValueEnumMetadata<number> | number
}

