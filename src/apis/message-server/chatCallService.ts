import type {ChatCallType, RestResult, UserChatCallResponseBody} from "@/types/apis";
import axios from "@/requests/http.ts";
import {formUrlEncoded} from "@/utils";

/**
 * 用户通话领域服务：`/api[/message-server]/user/chat/call`
 *
 * @author maurice.chen
 */
export class ChatCallService {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = ChatCallService.BASE_URL + '/user/chat/call'

  static create(
    userChatRoomId:number,
    type:ChatCallType,
    callingPrincipals:string[]
  ):Promise<RestResult<UserChatCallResponseBody>> {
    return axios.post(ChatCallService.SERVICE_URL + "/" + type + "/" + userChatRoomId, formUrlEncoded({callingPrincipals}))
  }

  static completed(userChatCallId:number) {
    return axios.delete(ChatCallService.SERVICE_URL,{params:formUrlEncoded({userChatCallId})})
  }
}
