import type {
  BasicUserChatConversation,
  PageRequest,
  PageResult,
  RestResult,
  TotalPage,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageReadResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
  UserChatRoomEntity,
} from "@/types/apis";
import type {ChatContentBlock} from "@/types/composables";
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'

/**
 * 用户聊天消息领域服务：`/api[/message-server]/user/chat`
 *
 * @author maurice.chen
 */
export class ChatMessageService  {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = ChatMessageService.BASE_URL + '/user/chat'

  static readonly CREATE_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation/create'

  static readonly CREATE_SEND_URL = ChatMessageService.SERVICE_URL + '/send'

  static readonly CREATE_HISTORIES_URL = ChatMessageService.SERVICE_URL + '/message/histories'

  static readonly MESSAGE_READ_URL = ChatMessageService.SERVICE_URL + '/message/read'

  static readonly MESSAGE_UNDO_URL = ChatMessageService.SERVICE_URL + '/message/undo'

  static readonly MESSAGE_POSITIONING_PAGE_NUMBER_URL = ChatMessageService.SERVICE_URL + '/message/positioning/page/number'

  static readonly CREATE_PINNED_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation/pinned'

  static readonly CREATE_MUTED_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation/muted'

  static readonly CREATE_DELETE_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation'

  static readonly ADD_ROOM_PARTICIPANT_URL = ChatMessageService.SERVICE_URL + '/participant/add'

  static readonly REMOVE_ROOM_PARTICIPANT_URL = ChatMessageService.SERVICE_URL + '/participant/remove'

  static readonly FIND_PARTICIPANT_URL = ChatMessageService.SERVICE_URL + '/participant/find'

  static readonly UPDATE_PARTICIPANT_TYPE_URL = ChatMessageService.SERVICE_URL + '/participant/update/type'

  static readonly PARTICIPANT_EXIST_ROOM_URL = ChatMessageService.SERVICE_URL + '/participant/exist/room'

  static readonly DISBAND_ROOM_RUL =  ChatMessageService.SERVICE_URL + '/room/disband'

  static readonly ROOM_RENAME_URL = ChatMessageService.SERVICE_URL + '/room/rename'

  static readonly FIND_MESSAGE_READ_URL = ChatMessageService.SERVICE_URL + '/message/read/find'

  static readonly GET_CONVERSATION_URL = ChatMessageService.SERVICE_URL + '/conversation'

  static my(): Promise<RestResult<UserChatConversationResponseBody[]>> {
    return axios.post(ChatMessageService.SERVICE_URL)
  }

  static createConversation(body: UserChatRoomEntity, principals:string[]): Promise<RestResult<UserChatConversationResponseBody>> {
    return axios.put(ChatMessageService.CREATE_CONVERSATION_URL, body, {params:formUrlEncoded({principals})})
  }

  static send(body: ChatContentBlock[], roomId:string): Promise<RestResult<UserChatMessageResponseBody>> {
    return axios.put(ChatMessageService.CREATE_SEND_URL + '/' + roomId, body)
  }

  static histories(
    request: PageRequest,
    roomId:number
  ): Promise<RestResult<PageResult<UserChatMessageResponseBody> | TotalPage<UserChatMessageResponseBody>>> {
    return axios.post(ChatMessageService.CREATE_HISTORIES_URL + '/' + roomId, formUrlEncoded(request))
  }

  static readMessage(messageIds:number[]): Promise<RestResult<PageResult<UserChatMessageResponseBody>>> {
    return axios.post(ChatMessageService.MESSAGE_READ_URL, formUrlEncoded({messageIds}))
  }

  static undoMessage(ids:number[]): Promise<RestResult<void>> {
    return axios.delete(ChatMessageService.MESSAGE_UNDO_URL, {params:formUrlEncoded({ids})})
  }

  static positioningMessagePageNumber(
    chatRoomId: number,
    messageId: number,
    size: number
  ):Promise<RestResult<number>> {
    return axios.get(ChatMessageService.MESSAGE_POSITIONING_PAGE_NUMBER_URL + "/" + chatRoomId + "/" + messageId + "/" + size)
  }

  static pinnedConversation(ids:number[]): Promise<RestResult<BasicUserChatConversation[]>> {
    return axios.put(ChatMessageService.CREATE_PINNED_CONVERSATION_URL, formUrlEncoded({ids}))
  }

  static mutedConversation(ids:number[]): Promise<RestResult<BasicUserChatConversation[]>> {
    return axios.put(ChatMessageService.CREATE_MUTED_CONVERSATION_URL, formUrlEncoded({ids}))
  }

  static deleteConversation(ids:number[]): Promise<RestResult<void>> {
    return axios.delete(ChatMessageService.CREATE_DELETE_CONVERSATION_URL, {params: formUrlEncoded({ids})})
  }

  static addRoomParticipant(roomId:number,principals:string[]): Promise<RestResult<UserChatConversationResponseBody>> {
    return axios.put(ChatMessageService.ADD_ROOM_PARTICIPANT_URL + "/" + roomId, formUrlEncoded({principals}))
  }

  static findRoomParticipant(roomId:number): Promise<RestResult<UserChatParticipantEntity[]>> {
    return axios.post(ChatMessageService.FIND_PARTICIPANT_URL + "/" + roomId)
  }

  static removeRoomParticipant(roomId:number,principals:string[]): Promise<RestResult<void>> {
    return axios.put(ChatMessageService.REMOVE_ROOM_PARTICIPANT_URL + "/" + roomId, formUrlEncoded({principals}))
  }

  static updateParticipantType(roomId:number, type:number, principals:string[]): Promise<RestResult<void>> {
    return axios.put(ChatMessageService.UPDATE_PARTICIPANT_TYPE_URL + "/" + roomId, formUrlEncoded({type, principals}))
  }

  static existRoom(roomId: number): Promise<RestResult<void>> {
    return axios.delete(ChatMessageService.PARTICIPANT_EXIST_ROOM_URL, {params:formUrlEncoded({roomId})})
  }

  static disbandRoom(roomId: number): Promise<RestResult<void>> {
    return axios.delete(ChatMessageService.DISBAND_ROOM_RUL, {params:formUrlEncoded({roomId})})
  }

  static roomRename(roomId:number, newName: string):Promise<RestResult<void>> {
    return axios.put(ChatMessageService.ROOM_RENAME_URL + "/" + roomId, formUrlEncoded({newName}))
  }

  static findMessageRead(messageId:number):Promise<RestResult<UserChatMessageReadResponseBody[]>> {
    return axios.post(ChatMessageService.FIND_MESSAGE_READ_URL + "/" + messageId)
  }

  static getConversation(roomId:number, convertBody:boolean = false):Promise<RestResult<UserChatConversationEntity | UserChatConversationResponseBody>> {
    return axios.get(ChatMessageService.GET_CONVERSATION_URL + "/" + roomId, {params:formUrlEncoded({convertBody})})
  }
}
