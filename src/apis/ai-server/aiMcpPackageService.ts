import type {
  McpClientTransportMetadata,
  McpPackageEntity,
  McpPackageSavePayload,
  McpToolMetadata,
  PageRequest,
  RestResult,
  TotalPage,
} from '@/types/apis'
import axios from '@/requests/http.ts'
import {formUrlEncoded} from '@/utils'
import {PageRestfulCrudService} from '@/apis'

/**
 * MCP 广场配置：`/api[/ai-server]/ai/mcp/package`
 *
 * 分页为 `POST` 类根路径（非 `/page`），与后端 {@code AiMcpPackageController} 一致。
 *
 * @author maurice.chen
 */
export class AiMcpPackageService extends PageRestfulCrudService<
  McpPackageSavePayload,
  McpPackageEntity,
  TotalPage<McpPackageEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  static readonly SERVICE_URL = AiMcpPackageService.BASE_URL + '/ai/mcp/package'

  static readonly TOOLS_URL = AiMcpPackageService.SERVICE_URL + '/tools'

  static readonly RELEASE_URL = AiMcpPackageService.SERVICE_URL + '/release'

  static readonly REVOKE_URL = AiMcpPackageService.SERVICE_URL + '/revoke'

  constructor() {
    super(AiMcpPackageService.SERVICE_URL)
  }

  /** `POST /ai/mcp/package`（对齐后端根路径 page，覆盖基类 `/page`） */
  page(request: PageRequest): Promise<RestResult<TotalPage<McpPackageEntity>>> {
    return axios.post(this.baseUrl, formUrlEncoded(request as Record<string, unknown>))
  }

  /** `POST /ai/mcp/package/tools` */
  listTools(entity: McpClientTransportMetadata): Promise<RestResult<McpToolMetadata[]>> {
    return axios.post(AiMcpPackageService.TOOLS_URL, entity)
  }

  release(ids:number[]):Promise<RestResult<void>> {
    return axios.post(AiMcpPackageService.RELEASE_URL, formUrlEncoded({ids}))
  }

  revoke(ids:number[]):Promise<RestResult<void>> {
    return axios.post(AiMcpPackageService.REVOKE_URL, formUrlEncoded({ids}))
  }
}
