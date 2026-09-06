/**
 * @file 个人用户 REST 客户端
 * @description 对接 `personal/user`：仅 `page` / `get` / `export`，无增删改。
 */
import {PageSearchRestfulService} from '@/apis/pageSearchRestfulService.ts'
import type {PersonalUserEntity, TotalPage} from '@/types/apis'

/**
 * 个人用户：`/api[/auth-server]/personal/user`
 *
 * @author maurice.chen
 */
export class PersonalUserService extends PageSearchRestfulService<
  PersonalUserEntity,
  TotalPage<PersonalUserEntity>
> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = PersonalUserService.BASE_URL + '/personal/user'

  constructor() {
    super(PersonalUserService.SERVICE_URL)
  }
}
