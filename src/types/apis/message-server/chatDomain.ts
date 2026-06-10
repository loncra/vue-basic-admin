import type {NameValueEnumMetadata, VersionEntityMetadata} from "../common";
import type {ChatContentBlock} from "@/types/composables";
import type {FileObject, UserMetadata} from "@/types/apis";

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
  revoke: NameValueEnumMetadata<number> | number;
  /** 撤销时间 */
  revocationTime: number;
  metadata: Record<string, unknown>;
  type: NameValueEnumMetadata<number> | number;
}

export interface UserChatParticipantDetails {
  details: UserMetadata;
}

export interface UserChatParticipantMetadata {
  /**
   * 是否房主
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

export interface UserChatMessageResponseBody extends UserChatMessageEntity {
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

  participant: UserChatParticipantMetadata;
}

export interface BasicUserChatConversation extends VersionEntityMetadata {
  /** 所属用户 */
  principal: string;
  name: string
  cover: FileObject[]
  /** 是否置顶 */
  pinned: NameValueEnumMetadata<number> | number;
  /** 是否免打扰 */
  muted: NameValueEnumMetadata<number> | number;
  /** 草稿内容 */
  draft: Record<string, unknown>[];
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
