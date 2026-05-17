/**
 * @file 数据字典 REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，具备详情 + 条件列表 + 增删改；
 * 网关前缀随 `RUNTIME_MODE` 在单体与微服务间切换。
 */
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {RestResult, TotalPage, TreeSortMetadata} from "@/types";
import type {
  DataDictionaryEntity,
  DataDictionarySavePayload
} from "@/types/resource-server/dataDictionaryDomain.ts";
import axios from "@/requests/http.ts";

/**
 * 数据字典领域服务：`/api[/resource-server]/data/dictionary`
 *
 * @author maurice.chen
 */
export class DataDictionaryService extends PageRestfulCrudService<DataDictionarySavePayload, DataDictionaryEntity, TotalPage<DataDictionaryEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = DataDictionaryService.BASE_URL + '/data/dictionary'
  static readonly SERVICE_SORT = DataDictionaryService.SERVICE_URL + "/sort"

  constructor() {
    super(DataDictionaryService.SERVICE_URL)
  }

  sort(sorts:TreeSortMetadata<number>[]):Promise<RestResult<void>> {
    return axios.put(DataDictionaryService.SERVICE_SORT, sorts)
  }
}
