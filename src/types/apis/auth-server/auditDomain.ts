import type {BasicIdMetadata, NameValueEnumMetadata} from "@/types/apis/common";
import type {Details, IdNameMetadata} from "@/types/apis";

export interface ControllerAuditEventMetadata extends IdNameMetadata{
  startTime: number

  executeStatus: NameValueEnumMetadata<number>

  exception: string;

  endTime: number

  remark: string

  url: string

  httpMethod: string

  headers: Record<string, string[]>

  parameters: Record<string, string[]>

  body: Record<string, object>
}

export interface OperationTrace {

  /**
   * 操作目标
   */
  target: string

  /**
     * 数据信息
     */
  data: Record<string, object>

  /**
   * 参数数据类型
   */
  type: NameValueEnumMetadata<string>

  /**
   * 标注
   */
  remark: string
}

export interface AuditEventData {
  metadata:ControllerAuditEventMetadata
  details?: Details
  operationTrace?: OperationTrace
}

/**
 * 审计事件
 * @author maurice.chen
 */
export interface AuditEventEntity extends BasicIdMetadata<string> {
  /**
   * 时间戳
   */
  timestamp: number
  /**
   * 主体
   */
  principal: string
  /**
   * 类型
   */
  type: string
  /**
   * 数据
   */
  data?: AuditEventData
}
