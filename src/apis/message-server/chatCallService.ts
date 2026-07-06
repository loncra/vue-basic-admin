import type {
  ChatCallType,
  RestResult,
  UserChatCallEntity, UserChatCallParticipantEntity,
  UserChatCallResponseBody
} from "@/types/apis";
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

  static readonly ACCEPT_URL = ChatCallService.SERVICE_URL + '/accept'

  static readonly REJECTED_URL = ChatCallService.SERVICE_URL + '/rejected'

  static create(
    userChatRoomId:number,
    type:ChatCallType,
    callingPrincipals:string[]
  ):Promise<RestResult<UserChatCallResponseBody>> {
    return axios.post(ChatCallService.SERVICE_URL + "/" + type + "/" + userChatRoomId, formUrlEncoded({callingPrincipals}))
  }

  static completed(userChatCallId:number):Promise<RestResult<void>> {
    return axios.delete(ChatCallService.SERVICE_URL,{params:formUrlEncoded({userChatCallId})})
  }

  static accept(userChatCallId:number):Promise<RestResult<UserChatCallParticipantEntity>> {
    return axios.put(ChatCallService.ACCEPT_URL + "/" + userChatCallId)
  }

  static rejected(userChatCallId:number):Promise<RestResult<void>> {
    return axios.put(ChatCallService.REJECTED_URL + "/" + userChatCallId)
  }

  static getUserChatCall(userChatCallId: number, responseBody:boolean = false):Promise<RestResult<UserChatCallEntity | UserChatCallResponseBody>> {
    return axios.get(ChatCallService.SERVICE_URL + "/" + userChatCallId,{params:formUrlEncoded({responseBody})})
  }
}
