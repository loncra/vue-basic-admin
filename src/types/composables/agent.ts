import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {
  AgentConversationEntity,
  AgentWorkspaceResponseBody,
  ObjectWriteResult,
  PageResult
} from "@/types/apis";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";
import type {ChatContentBlock} from "@/types/composables/chat.ts";
import type {Ref} from "vue";

export type ConversationBubbleItem = BubbleItemType & {

}

/** 列表项上的工作空间编辑标记（创建 / 重命名共用） */
export type WorkspaceConversationItem = ConversationItemType & {
  editing?: boolean
  data?: AgentWorkspaceResponseBody
  conversations?: AgentActiveConversationProps[]
}

export interface AgentActiveConversationProps extends AgentConversationEntity {
  dataSource?: PageResult<ConversationBubbleItem>
}

export interface AgentChatContext{
  workspaces:Ref<WorkspaceConversationItem[]>,
  conversationActive:Ref<AgentActiveConversationProps>
  loading?:boolean
}

export interface AgentSenderFormProps {
  /**
   * 模型设置 id
   */
  modelId?: number;

  /**
   * 应答类型:10.ask,20.plan,30.agent
   */
  type?: number;

  /**
   * 消息词槽格式内容
   */
  content: ChatContentBlock[];

  /**
   * 附件媒体内容
   */
  attachment?: ObjectWriteResult[];

  /**
   * 附加 元数据内容
   */
  metadata?: Record<string, unknown>;
}

export interface AgentChatRequestBody extends AgentSenderFormProps {
  /**
   * 会话 id
   */
  agentConversationId?: number;

  /**
   * 工作空间 id
   */
  agentWorkspaceId?: number;
}

export interface AgentChatResponseBody {
  conversation: AgentConversationEntity
  userMessageId:number
}

export interface AgentSenderProps {
  onSubmit: (data: AgentSenderFormProps) => void;
}
