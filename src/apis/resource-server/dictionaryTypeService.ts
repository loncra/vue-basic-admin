/**
 * @file 字典类型 REST 客户端
 * @description 继承 {@link FindRestfulCrudService}，具备详情 + 条件列表 + 增删改；
 * 网关前缀随 `RUNTIME_MODE` 在单体与微服务间切换。
 */
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import type {
  DictionaryTypeEntity,
  DictionaryTypeSavePayload
} from "@/types/apis/resource-server/dictionaryTypeDomain.ts";

/**
 * 字典类型领域服务：`/api[/resource-server]/dictionary/type`
 *
 * @author maurice.chen
 */
export class DictionaryTypeService extends FindRestfulCrudService<DictionaryTypeSavePayload, DictionaryTypeEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = DictionaryTypeService.BASE_URL + '/dictionary/type'

  constructor() {
    super(DictionaryTypeService.SERVICE_URL)
  }
}
