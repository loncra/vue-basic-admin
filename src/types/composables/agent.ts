import type {ConversationItemType} from "@antdv-next/x/dist/conversations/interface";
import type {AgentWorkspaceEntity, PageResult} from "@/types/apis";
import type {BubbleItemType} from "@antdv-next/x/dist/bubble/interface";

export type ConversationBubbleItem = BubbleItemType & {

}

/** 列表项上的工作空间编辑标记（创建 / 重命名共用） */
export type WorkspaceConversationItem = ConversationItemType & {
  editing?: boolean
  data?: AgentWorkspaceEntity
  dataSource: PageResult<ConversationBubbleItem>
}
