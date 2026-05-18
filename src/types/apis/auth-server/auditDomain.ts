import type {BasicIdMetadata} from "@/types/apis/common";

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
  data: Record<string, unknown>
}
