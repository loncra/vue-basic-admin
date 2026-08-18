import type {
  BasicIdMetadata, DataDictionaryMetadata,
  NameValueEnumMetadata,
  TimeProperties,
  VersionEntityMetadata,
} from '@/types/apis'
import type {MCP_CLIENT_TYPE} from '@/constants'
import type {KeyValueRow} from "@/types/composables";

export type McpClientType =
  | typeof MCP_CLIENT_TYPE.SSE
  | typeof MCP_CLIENT_TYPE.STDIO
  | typeof MCP_CLIENT_TYPE.STREAMABLE_HTTP

export interface McpToolMetadata {
  name:string
  title:string
  description:string
  annotation:ToolAnnotationMetadata
}

export interface ToolAnnotationMetadata {
  title:string
  readOnlyHint:boolean,
  destructiveHint:boolean,
  idempotentHint:boolean,
  openWorldHint:boolean,
  returnDirect:boolean
}

export interface McpClarifyToolPolicyMetadata {
  toolName: string
  maxClarifyRounds?: number | null
  enabled: NameValueEnumMetadata<number> | number

  description?: string
  annotation:ToolAnnotationMetadata
}

export interface McpClientTransportMetadata {
  type: McpClientType | string
}

export interface StdioMcpClientTransportMetadata extends McpClientTransportMetadata{
  type: typeof MCP_CLIENT_TYPE.STDIO
  command?: string
  args?: string[]
  env?: Record<string, string>
}

export interface SseMcpClientTransportMetadata extends McpClientTransportMetadata{
  type: typeof MCP_CLIENT_TYPE.SSE | typeof MCP_CLIENT_TYPE.STREAMABLE_HTTP
  baseUrl?: string
  endpoint: string
  timeout: TimeProperties
  headers?: Record<string, string[]>
  queryParams?: Record<string, string[]>
}

export interface StreamableHttpMcpClientTransportMetadata extends SseMcpClientTransportMetadata{
  type: typeof MCP_CLIENT_TYPE.STREAMABLE_HTTP
  openConnectionOnStartup?: boolean | number
  resumableStreams?: boolean | number
}

export interface McpPackageMetadata {
  client: McpClientTransportMetadata
  clarifyPolicies: McpClarifyToolPolicyMetadata[]
}

export interface McpPackageSavePayload extends BasicIdMetadata<number>, VersionEntityMetadata {
  name: string
  packageKey: string
  summary?: string
  tags?: string[]
  additionalInformation?: string
  authMode: NameValueEnumMetadata<number> | number
  origin: NameValueEnumMetadata<number> | number
  status: NameValueEnumMetadata<number> | number
  type: NameValueEnumMetadata<number> | number
  dynamicActivation: NameValueEnumMetadata<number> | number
  initializeTimeout: TimeProperties
  icon:string
  group?:DataDictionaryMetadata
  metadata: McpPackageMetadata
}

export interface McpPackageEntity extends McpPackageSavePayload {
  headerDataSource?:KeyValueRow[]
  queryParamDataSource?:KeyValueRow[]
  envDataSource?:KeyValueRow[]
}
