import type {
  PageRequest,
  RestResult,
  SkillPackageEntity,
  SkillPackageSavePayload,
  TotalPage,
} from '@/types/apis'
import axios from '@/requests/http.ts'
import {formUrlEncoded} from '@/utils'
import {PageRestfulCrudService} from '@/apis'

/**
 * Skill 广场配置：`/api[/ai-server]/ai/skill/package`
 *
 * 分页为 `POST` 类根路径（非 `/page`），与后端 {@code AiSkillPackageController} 一致。
 *
 * @author maurice.chen
 */
export class AiSkillPackageService extends PageRestfulCrudService<
  SkillPackageSavePayload,
  SkillPackageEntity,
  TotalPage<SkillPackageEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  static readonly SERVICE_URL = AiSkillPackageService.BASE_URL + '/ai/skill/package'

  static readonly RELEASE_URL = AiSkillPackageService.SERVICE_URL + '/release'

  static readonly REVOKE_URL = AiSkillPackageService.SERVICE_URL + '/revoke'
  static readonly REINGEST_ULR = AiSkillPackageService.SERVICE_URL + '/reingest'

  constructor() {
    super(AiSkillPackageService.SERVICE_URL)
  }

  /** `POST /ai/skill/package`（对齐后端根路径 page，覆盖基类 `/page`） */
  page(request: PageRequest): Promise<RestResult<TotalPage<SkillPackageEntity>>> {
    return axios.post(this.baseUrl, formUrlEncoded(request as Record<string, unknown>))
  }

  release(ids: number[]): Promise<RestResult<void>> {
    return axios.post(AiSkillPackageService.RELEASE_URL, formUrlEncoded({ids}))
  }

  revoke(ids: number[]): Promise<RestResult<void>> {
    return axios.post(AiSkillPackageService.REVOKE_URL, formUrlEncoded({ids}))
  }

  reingest(ids: number[]): Promise<RestResult<void>> {
    return axios.post(AiSkillPackageService.REINGEST_ULR, formUrlEncoded({ids}))
  }
}
