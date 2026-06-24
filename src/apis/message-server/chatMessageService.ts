import type {
  BasicUserChatConversation,
  FileObject, ObjectWriteResult,
  PageRequest,
  PageResult,
  RestResult,
  TotalPage,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageReadResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
  UserChatRoomEntity,
} from "@/types/apis";
import type {ChatBubbleItem, ChatContentBlock, TextBlock} from "@/types/composables";
import {formUrlEncoded} from "@/utils";
import axios from '@/requests'
import {h, type VNode} from "vue";
import {AttachmentService} from "@/apis";
import {Avatar, AvatarGroup} from 'antdv-next'
import type {AvatarSize} from "antdv-next/dist/avatar/AvatarContext";
import i18n from "@/i18n";
import {CHAT_BUBBLE_TYPE} from "@/constants/messageConstant.ts";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {UploadFile} from "antdv-next/dist/upload/interface";

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

  static getMessageContent(lastUserMessage: UserChatMessageEntity | undefined) {
    if (!lastUserMessage) {
      return ''
    }
    let content = ""
    for (const block of lastUserMessage.content) {
      if (block.type === 'text') {
        content += block.value || ''
      } else if (block.type === 'custom' && block.slotKind === 'files') {
        for (const file of block.files || []) {
          const contentType = file?.extraHeaders?.['Content-Type'] || ''
          if (contentType.startsWith('image/')) {
            content += '[' + i18n.global.t('attachment.type.image') + ']'
          } else if (contentType.startsWith('video/')) {
            content += '[' + i18n.global.t('attachment.type.video') + ']'
          } else if (contentType.startsWith('audio/')) {
              content += '[' + i18n.global.t('attachment.type.audio') + ']'
          } else {
            content += '[' + i18n.global.t('attachment.type.unknown') + ']'
          }
        }
      }
    }
    return content
  }

  /** 会话列表草稿预览 */
  static getDraftContent(draft: SlotConfigType[] | undefined): string {
    if (!draft?.length) {
      return ''
    }
    return this.convertSlotConfigToText(draft)
  }

  // ---------- SlotConfigType（Sender 草稿 / 词槽）----------
  static convertSlotConfigToText(slots: SlotConfigType[]): string {
    let result = ''
    for (const slot of slots) {
      result += this.slotConfigItemToText(slot)
    }
    return result
  }

  private static slotConfigItemToText(slot: SlotConfigType): string {
    switch (slot.type) {
      case 'text':
        return slot.value ?? ''
      case 'input':
      case 'content': {
        const value = slot.props?.defaultValue
        if (value != null && value !== '') {
          return String(value)
        }
        const placeholder = slot.props?.placeholder
        return placeholder ? `[${placeholder}]` : ''
      }
      case 'select': {
        const value = slot.props?.defaultValue
        const options = slot.props?.options as Array<{ label?: string; value?: string }> | undefined
        if (value != null && options?.length) {
          const matched = options.find(o => o.value === value)
          if (matched?.label) {
            return String(matched.label)
          }
        }
        return value != null ? String(value) : ''
      }
      case 'tag':
        return slot.props?.label != null ? String(slot.props.label) : ''
      case 'custom':
        return this.customSlotToText(slot)
    }
  }

  private static customSlotToText(
    slot: Extract<SlotConfigType, { type: 'custom' }>,
  ): string {
    const props = slot.props as Record<string, unknown> | undefined
    const slotKind = props?.slotKind
    if (slotKind === 'files') {
      const files = props?.defaultValue as UploadFile<ObjectWriteResult>[] | undefined
      return this.filesToTypeLabels(files)
    }
    return ''
  }

  private static filesToTypeLabels(
    files: Array<ObjectWriteResult | UploadFile<ObjectWriteResult>> | undefined,
  ): string {
    if (!files?.length) {
      return ''
    }
    let result = ''
    for (const file of files) {
      result += this.fileToTypeLabel(file)
    }
    return result
  }
  private static fileToTypeLabel(
    file: ObjectWriteResult | UploadFile<ObjectWriteResult> | undefined,
  ): string {
    const contentType =
      (file as ObjectWriteResult)?.extraHeaders?.['Content-Type']
      ?? (file as UploadFile<ObjectWriteResult>)?.type
      ?? (file as UploadFile<ObjectWriteResult>)?.originFileObj?.type
      ?? ''
    if (contentType.startsWith('image/')) {
      return `[${i18n.global.t('attachment.type.image')}]`
    }
    if (contentType.startsWith('video/')) {
      return `[${i18n.global.t('attachment.type.video')}]`
    }
    if (contentType.startsWith('audio/')) {
      return `[${i18n.global.t('attachment.type.audio')}]`
    }
    return `[${i18n.global.t('attachment.type.unknown')}]`
  }

  static addBubbleListMessage(
    body: UserChatMessageEntity,
    role:BubbleItemType["role"],
    bubbleList:ChatBubbleItem[],
    append:boolean = false,
    hide:boolean = false,
  ) {
    const index = bubbleList.findIndex(b => b.key === String(body.id))
    if (index >= 0) {
      bubbleList[index] = {
        key: String(body.id),
        role,
        content: body.content,
        data: body,
        hide
      }
      return
    }

    const items = role === CHAT_BUBBLE_TYPE.SYSTEM
    ? body.content.map(c => ({
        key: String(body.id),
        role,
        content: (c as TextBlock).value as unknown as ChatContentBlock,
        data: body,
        hide
      }))
    : [{
        key: String(body.id),
        role,
        content: body.content,
        data: body,
        hide
      }]

    if (!append) {
      bubbleList.splice(0, 0, ...items)
    } else {
      bubbleList.push(...items)
    }
  }

  static createAvatarNode(
    cover:FileObject[],
    defaultLabel:string,
    size:AvatarSize = 'medium',
    groupClass:string="[&>*:not(:first-child)]:-ms-6!"
  ) {
    let avatar;
    const avatars:VNode[] = []
    for (const c of cover) {
      const a = h(
        Avatar,
        {src: AttachmentService.query(c.bucketName, c.objectName), size}
      )
      avatars.push(a)
    }
    if (avatars.length > 0) {
      avatar = h(
        AvatarGroup,
        {
          max:{
            count:3
          },
          size,
          class:groupClass ? groupClass : undefined
        },
        {
          default: () => avatars
        }
      )
    } else {
      avatar = h(
        Avatar,
        {size},
        { default: () => defaultLabel.substring(0, 1) }
      )
    }
    return avatar
  }
}
