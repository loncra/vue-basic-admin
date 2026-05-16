/**
 * @file 控制台用户（Console User）REST 客户端
 * @description 继承 {@link PageRestfulCrudService}，列表走分页接口，分页数据结构为 {@link TotalPage}。
 */
import type {
  ConsoleUserEntity,
  ConsoleUserSavePayload
} from '../../types/auth-server/consoleUserDomain'
import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {TotalPage} from "@/types";

/**
 * 控制台用户领域服务：`/api[/auth-server]/console/user`
 *
 * @author maurice.chen
 */
export class ConsoleUserService extends PageRestfulCrudService<
  ConsoleUserSavePayload,
  ConsoleUserEntity,
  TotalPage<ConsoleUserEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = ConsoleUserService.BASE_URL + '/console/user'

  constructor() {
    super(ConsoleUserService.SERVICE_URL)
  }
}
