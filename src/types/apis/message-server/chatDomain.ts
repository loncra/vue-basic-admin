import type {NameEnumMetadata, NameValueEnumMetadata, VersionEntityMetadata} from "../common";
import type {ObjectWriteResult} from "@/types/apis";
import type {AttachmentValue} from "@/types/composables/attachmentUpload.ts";

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
  /** 名称 */
  name: string;
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
  content: Record<string, unknown>;
  /** 发送者 */
  principal: string;
  /** 是否撤销 */
  revoke: NameValueEnumMetadata<number> | number;
  /** 撤销时间 */
  revocationTime: number;
}

export interface BasicUserChatConversation extends VersionEntityMetadata {
  /** 所属用户 */
  principal: string;
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
  lastUserMessage: UserChatMessageEntity;
  /** 房间 */
  room: UserChatRoomEntity;
}

export type TextSegment =
  | { type: 'plain'; text: string }
  | { type: 'mention'; value: string; label: string }
  | { type: 'emoji'; value: string; label: string }

export interface TextContentBlock {
  type: 'text'
  segments: TextSegment[]
}

export interface ChatMessageContent {
  type: 'composite'
  version: 1
  blocks: ChatContentBlock[]
}

export type ChatContentBlock =
  | TextContentBlock
  | { type: 'image'; file: ObjectWriteResult }
  | { type: 'video'; file: ObjectWriteResult }
  | { type: 'files'; files: ObjectWriteResult[] }

export type DraftFileItem = {
  id: string
  localFile: File
  fileName: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  result?: ObjectWriteResult
  error?: string
}

export type DraftTextBlock = {
  id: string
  type: 'text'
  segments: TextSegment[]
}

export type DraftMediaBlock = {
  id: string
  type: 'image' | 'video'
  localFile: File
  previewUrl?: string
  fileName: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  result?: ObjectWriteResult
  error?: string
}

export type DraftFilesBlock = {
  id: string
  type: 'files'
  items: DraftFileItem[]
}

export type DraftBlock = DraftTextBlock | DraftMediaBlock | DraftFilesBlock

export type AttachmentBlock = {

}
