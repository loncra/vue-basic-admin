import {PageRestfulCrudService} from "@/apis/pageRestfulCrudService.ts";
import type {ConsoleUserEntity, ConsoleUserSavePayload, TotalPage} from "@/types/apis";

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
