import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {
  FilterRequest,
  ModelSettingEntity,
  ModelSettingSavePayload,
  RestResult,
  TotalPage
} from "@/types/apis";
import axios from "@/requests/http.ts";
import {formUrlEncoded} from "@/utils";

/**
 * 模型设置领域服务：`/api[/ai-server]/model/setting`
 *
 * @author maurice.chen
 */
export class ModelSettingService extends PageRestfulCrudService<
  ModelSettingSavePayload,
  ModelSettingEntity,
  TotalPage<ModelSettingEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  static readonly SERVICE_URL = ModelSettingService.BASE_URL + '/model/setting'

  static readonly FIND_ENABLED = ModelSettingService.SERVICE_URL + '/enabled'

  constructor() {
    super(ModelSettingService.SERVICE_URL)
  }

  find(filter:FilterRequest = {}) :Promise<RestResult<ModelSettingEntity[]>> {
    return axios.post(ModelSettingService.FIND_ENABLED, formUrlEncoded(filter))
  }
}
