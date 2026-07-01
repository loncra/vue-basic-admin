import type {NameValueEnumMetadata, VersionEntityMetadata} from "../common";
import type {ChatContentBlock} from "@/types/composables";
import type {FileObject, PlatformUser} from "@/types/apis";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import {CHAT_CALL_TYPE, VIDEO_CHAT_CONSTRAINTS} from "@/constants/messageConstant.ts";

/**
 * 聊天房间
 *
 * @author maurice.chen
 */
export interface UserChatRoomEntity extends VersionEntityMetadata {
  /** 业务  id */
  businessId?: string;
  /** 业务 场景 */
  businessScene?: string;
  /** 房间类型 */
  type?: NameValueEnumMetadata<number> | number;
  metadata?: Record<string, unknown>;
}

/**
 * 用户聊天消息实体
 *
 * @author maurice.chen
 */
export interface UserChatMessageEntity extends VersionEntityMetadata {
  /** 业务  id */
  chatRoomId: number;
  /** 内容 */
  content: ChatContentBlock[];
  /** 发送者 */
  principal: string;
  /** 是否撤销 */
  undo: NameValueEnumMetadata<number> | number
  /** 可撤销时间 */
  undoableTime:number
  /** 撤销时间 */
  undoTime: number;
  metadata: Record<string, unknown>;
  type: NameValueEnumMetadata<number> | number
}

export interface UserChatParticipantDetails {
  details: PlatformUser;
}

export interface UserChatParticipantMetadata {
  /**
   * 参与者类型
   */
  type: NameValueEnumMetadata<number> | number;
  /**
   * 元数据信息
   */
  metadata: UserChatParticipantDetails;
}

export interface UserChatParticipantEntity extends VersionEntityMetadata, UserChatParticipantMetadata {
  principal: string;
}

export interface ParticipantMetadataMessageResponseBody extends UserChatMessageEntity {
  participant: UserChatParticipantMetadata;
}

export interface UserChatMessageResponseBody extends ParticipantMetadataMessageResponseBody {
  /**
   * 可读数量
   */
  readableCount: number;
  /**
   * 已读数量
   */
  readCount: number;

  /**
   * 当前用户是否可读
   */
  readable: NameValueEnumMetadata<number> | number;
}

export interface MessageContentMentionMetadata  {
  messageId:number
  creationTime:number
  participant: UserChatParticipantMetadata
}

export interface BasicUserChatConversation extends VersionEntityMetadata {
  /**
   * 所属用户
   **/
  principal: string
  name: string
  cover: FileObject[]
  /**
   * 是否置顶
   * */
  pinned: NameValueEnumMetadata<number> | number
  /**
   * 置顶时间
   **/
  pinnedTime: number
  /**
   * 状态:10.启用,20.已退出,30.已解散
   */
  status:NameValueEnumMetadata<number> | number
  /**
   * 是否免打扰
   **/
  muted: NameValueEnumMetadata<number> | number
  /**
   * 提及内容
   */
  mentions?:MessageContentMentionMetadata[]
}

export interface UserChatConversationEntity extends BasicUserChatConversation {
  /** 房间 id */
  userChatRoomId: number;
  /** 最后一条消息内容 */
  lastUserChatMessageId: number;
}

export interface UserChatConversationResponseBody extends BasicUserChatConversation {
  /** 最后一条消息内容 */
  lastUserMessage: UserChatMessageEntity
  /** 房间 */
  room: UserChatRoomEntity
  /** 可读数量 **/
  readableCount: number
  /** 草稿内容 */
  draft?: SlotConfigType[]
}

export interface UserChatMessageReadEntity extends VersionEntityMetadata {
  /**
   * 业务  id
   */
  chatMessageId: number;

  /**
   * 发送者
   */
  principal: string;

  /**
   * 是否可读
   */
  readable: NameValueEnumMetadata<number> | number;

  /**
   * 读取时间
   */
  readTime: number;
}

export interface UserChatMessageReadResponseBody extends UserChatMessageReadEntity {
  participant: UserChatParticipantMetadata;
}

export type ChatCallType = typeof CHAT_CALL_TYPE.VIDEO | typeof CHAT_CALL_TYPE.VOICE;

export interface UserChatCallEntity extends VersionEntityMetadata {
  /**
   * 业务  id
   */
  userChatRoomId: number;

  /**
   * 房间类型
   */
  type: NameValueEnumMetadata<number> | number;

  /**
   * 元数据信息
   */
  metadata: Record<string, unknown>;

  /**
   * 开始时间
   */
  startTime: number;

  /**
   * 结束时间
   */
  endTime: number;

  /**
   * 状态
   */
  status: NameValueEnumMetadata<number> | number;

  /**
   * 名称
   */
  name: string;
}

export interface UserChatCallParticipantEntity extends VersionEntityMetadata, UserChatParticipantMetadata {

  /**
     * 聊天通话逐渐 id
     */
  userChatCallId: number;


  /**
   * 状态
   */
  status: NameValueEnumMetadata<number> | number;

  /**
   * 加入时间
   */
  joinTime: number;

  /**
   * 离开时间
   */
  leaveTime: number;
}

export interface UserChatCallResponseBody extends UserChatCallEntity {
  room: UserChatRoomEntity
  participants: UserChatCallParticipantEntity[]
}
