/**
 * @file 数据字典 REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，具备详情 + 条件列表 + 增删改；
 * 网关前缀随 `RUNTIME_MODE` 在单体与微服务间切换。
 */
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {
  CarouselEntity,
  CarouselSavePayload,
  RestResult,
  TotalPage,
  TreeSortMetadata
} from "@/types/apis";

import axios from "@/requests/http.ts";
import {formUrlEncoded} from "@/utils";

/**
 * 轮播图领域服务：`/api[/resource-server]/carousel`
 *
 * @author maurice.chen
 */
export class CarouselService extends PageRestfulCrudService<CarouselSavePayload, CarouselEntity, TotalPage<CarouselEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = CarouselService.BASE_URL + '/carousel'
  static readonly SERVICE_RELEASE = CarouselService.SERVICE_URL + '/release'
  static readonly SERVICE_REVOKE = CarouselService.SERVICE_URL + '/revoke'
  static readonly SERVICE_SORT = CarouselService.SERVICE_URL + "/sort"

  constructor() {
    super(CarouselService.SERVICE_URL)
  }

  sort(sorts:TreeSortMetadata<number>[]):Promise<RestResult<void>> {
    return axios.put(CarouselService.SERVICE_SORT, sorts)
  }

  release(ids:number[]):Promise<RestResult<void>> {
    return axios.post(CarouselService.SERVICE_RELEASE, formUrlEncoded({ids}))
  }

  revoke(ids:number[]):Promise<RestResult<void>> {
    return axios.post(CarouselService.SERVICE_REVOKE, formUrlEncoded({ids}))
  }
}
