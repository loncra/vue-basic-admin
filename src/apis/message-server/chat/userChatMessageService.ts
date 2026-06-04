import type {PageResult, UserChatMessageEntity} from "@/types/apis";
import {PageSearchRestfulService} from "@/apis";

/**
 * 用户聊天消息服务：`/api[/message-server]/user/cha/message`
 *
 * @author maurice.chen
 */
export class UserChatMessageService extends PageSearchRestfulService<UserChatMessageEntity, PageResult<UserChatMessageEntity>> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = UserChatMessageService.BASE_URL + '/user/chat/message'

  static readonly FIND_URL = '/find'

  constructor() {
    super(UserChatMessageService.SERVICE_URL);
  }

}
