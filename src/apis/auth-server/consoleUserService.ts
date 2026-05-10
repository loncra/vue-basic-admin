import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType'
import {PageRestfulCrudService} from "@/apis/pageRestfulCurdService.ts";
import type {TotalPage} from "@/types";

/**
 * 控制台用户服务
 *
 * @author maurice.chen
 */
export class ConsoleUserService extends PageRestfulCrudService<ConsoleUserEntity, TotalPage<ConsoleUserEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  /** 服务基础 URL */
  static readonly SERVICE_URL = ConsoleUserService.BASE_URL + '/console/user'

  constructor() {
    super(ConsoleUserService.SERVICE_URL)
  }
}
