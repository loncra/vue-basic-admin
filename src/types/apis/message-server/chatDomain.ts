import type {NameEnumMetadata, NameValueEnumMetadata, VersionEntityMetadata} from "../common";

/**
 * 聊天房间
 *
 * @author maurice.chen
 */
export interface UserChatRoomEntity extends VersionEntityMetadata {
  /**
   * 业务  id
   */
  businessId: string;

  /**
   * 名称
   */
  name: string;

  /**
   * 房间类型
   */
  type: NameValueEnumMetadata<number> | number;

  metadata: Record<string, unknown>;
}

/**
 * 用户聊天消息实体
 *
 * @author maurice.chen
 */
export interface UserChatMessageEntity extends VersionEntityMetadata {
  /**
   * 业务  id
   */
  chatRoomId: number;

  /**
   * 内容
   */
  content: Record<string, unknown>;

  /**
   * 发送者
   */
  principal: string;

  /**
   * 是否撤销
   */
  revoke: NameValueEnumMetadata<number> | number;
  /**
   * 撤销时间
   */
  revocationTime: number;
}

/**
 * 聊天房间响应体
 *
 * @author maurice.chen
 */
export interface UserChatRoomResponseBody extends UserChatRoomEntity {
  /**
   * 可读数量
   */
  readableCount: number;

  /**
   * 最后一条消息
   */
  lastMessage: UserChatMessageEntity;
}
