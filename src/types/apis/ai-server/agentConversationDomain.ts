import type {NameValueEnumMetadata, VersionEntityMetadata} from "@/types/apis";

/**
 * Agent 对话（对齐 `AgentConversationEntity`）
 *
 * @author maurice.chen
 */
export interface AgentConversationEntity extends VersionEntityMetadata {
  name?: string
  status?: NameValueEnumMetadata<number> | number
  principal?: string
  tenantId?: string
  type:NameValueEnumMetadata<number> | number
  metadata?:Record<string, unknown>
  parentId?:number
  children?: AgentConversationEntity[]
  key?:string
}
