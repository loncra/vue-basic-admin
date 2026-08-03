import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {
  FilterRequest,
  ModelSettingEntity,
  ModelSettingSavePayload,
  RestResult,
  TotalPage, TreeSortMetadata
} from "@/types/apis";
import axios from "@/requests/http.ts";
import {formUrlEncoded} from "@/utils";
import {FindRestfulCrudService} from "@/apis";

/**
 * 模型设置领域服务：`/api[/ai-server]/model/setting`
 *
 * @author maurice.chen
 */
export class ModelSettingService extends FindRestfulCrudService<
  ModelSettingSavePayload,
  ModelSettingEntity
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  static readonly SERVICE_URL = ModelSettingService.BASE_URL + '/model/setting'

  static readonly FIND_ENABLED = ModelSettingService.SERVICE_URL + '/enabled'

  static readonly SORT_URL = ModelSettingService.SERVICE_URL + '/sort'

  constructor() {
    super(ModelSettingService.SERVICE_URL)
  }

  findEnabled(filter:FilterRequest = {}) :Promise<RestResult<ModelSettingEntity[]>> {
    return axios.post(ModelSettingService.FIND_ENABLED, formUrlEncoded(filter))
  }

  sort(sorts:TreeSortMetadata<number>[]):Promise<RestResult<void>> {
    return axios.put(ModelSettingService.SORT_URL, sorts)
  }
}
