import type {UserChatParticipantEntity} from "@/types/apis";
import {FindSearchRestfulService} from "@/apis";

/**
 * 用户聊天参与者服务：`/api[/message-server]/user/cha/message`
 *
 * @author maurice.chen
 */
export class UserChatParticipantService extends FindSearchRestfulService<UserChatParticipantEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = UserChatParticipantService.BASE_URL + '/user/chat/participant'

  static readonly FIND_URL = '/find'

  constructor() {
    super(UserChatParticipantService.SERVICE_URL);
  }

}
