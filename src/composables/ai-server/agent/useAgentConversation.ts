import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  ConversationsItemMenu,
  ConversationsProps,
  ItemType,
} from '@antdv-next/x/dist/conversations/interface'
import {AgentService} from '@/apis/ai-server/agentService.ts'
import type {AgentWorkspaceEntity, AgentWorkspaceResponseBody, RestResult} from '@/types/apis'
import {isResultSuccess} from '@/requests/http.ts'
import {createIcon, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {DEFAULT_OPERATE_CATEGORY} from '@/constants/systemConstant.ts'
import {AGENT_LIST_ITEM_KIND} from '@/constants/aiConstant.ts'
import useApp from 'antdv-next/dist/app/useApp'
import type {MenuInfo} from '@v-c/menu'
import type {AgentActiveConversationProps, WorkspaceConversationItem} from "@/types/composables";
import {useAgentChatContext} from "@/composables";

/**
 * 接口工作空间 → 侧栏源节点（保留嵌套 conversations，供 CRUD）
 */
function toWorkspaceItem(workspace: AgentWorkspaceResponseBody): WorkspaceConversationItem {
  // 对齐后端 AgentWorkspaceResponseBody.conversations
  const conversations: AgentActiveConversationProps[] = (workspace.conversations ?? []).map((item) => ({
    ...item,
  }))
  return {
    key: String(workspace.id),
    label: workspace.name,
    group: String(workspace.id),
    kind: AGENT_LIST_ITEM_KIND.WORKSPACE,
    data: workspace,
    editing: false,
    conversations,
  }
}

/**
 * 源节点拍平为 ax-conversations items：
 * - 编辑中的工作空间行原样透出（新建 / 重命名）
 * - 无会话时仍透出工作空间行（否则空组不渲染）
 * - 有会话时按会话展开，group = 工作空间 key
 */
function flattenWorkspaceItems(workspaces: WorkspaceConversationItem[]): WorkspaceConversationItem[] {
  return workspaces.flatMap((workspace) => {
    if (workspace.editing) {
      return [workspace]
    }
    const conversations = workspace.conversations ?? []
    if (conversations.length === 0) {
      return [workspace]
    }
    return conversations.map((conversation) => ({
      key: String(conversation.id),
      label: conversation.name ?? String(conversation.id),
      group: String(workspace.key),
      kind: AGENT_LIST_ITEM_KIND.CONVERSATION,
      data: workspace.data,
      conversation,
      editing: false,
    }))
  })
}

function isConversationItem(item: ItemType): item is WorkspaceConversationItem {
  return !('type' in item && item.type === 'divider')
}

export function useAgentConversation() {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const agentChatContent = useAgentChatContext()

  const loading = ref<boolean>(false)

  const {message, modal} = useApp()

  /** 拍平视图：编辑行透出，会话行带 group */
  const items = computed(() => flattenWorkspaceItems(agentChatContent.workspaces.value))

  const groupable = computed<ConversationsProps['groupable']>(() => ({
    collapsible: true,
    label: (group: string) => {
      const workspace = agentChatContent.workspaces.value.find((item) => item.key === group)
      return workspace?.label ?? group
    },
  }))

  /** 是否已有处于编辑态的工作空间行（同时只允许一条） */
  function hasEditingWorkspace(): boolean {
    return agentChatContent.workspaces.value.some((item) => isConversationItem(item) && item.editing)
  }

  /** 拍平行 → 源工作空间节点（CRUD 只打在源数据上） */
  function resolveWorkspace(item: WorkspaceConversationItem): WorkspaceConversationItem | undefined {
    if (item.kind === AGENT_LIST_ITEM_KIND.CONVERSATION) {
      return agentChatContent.workspaces.value.find(
        (workspace) => workspace.key === item.group || workspace.key === String(item.data?.id),
      )
    }
    return agentChatContent.workspaces.value.find((workspace) => workspace.key === item.key) ?? item
  }

  const menuConfig: ConversationsProps['menu'] = function (conversation) {
    const item = conversation as WorkspaceConversationItem
    const workspace = resolveWorkspace(item)
    if (!workspace?.data) {
      return undefined as unknown as ConversationsItemMenu
    }
    if (getEnumValue(workspace.data.operateCategory) === DEFAULT_OPERATE_CATEGORY.SYSTEM) {
      return undefined as unknown as ConversationsItemMenu
    }
    // 编辑中不展示菜单，避免重复进入编辑
    if (workspace.editing) {
      return undefined as unknown as ConversationsItemMenu
    }
    return {
      items: [
        {
          label: globalProperties.$t('common.rename'),
          key: 'rename',
          icon: () => createIcon('loncra-pencil'),
        },
        {
          type: 'divider',
        },
        {
          label: globalProperties.$t('common.delete.text'),
          key: 'delete',
          danger: true,
          icon: () => createIcon('loncra-archive-x'),
        },
      ],
      onClick: (menuItem) => onMenuClick(menuItem, workspace),
    }
  }

  function onMenuClick(itemInfo: MenuInfo, workspace: WorkspaceConversationItem): void {
    if (itemInfo.key === 'rename') {
      startRenameWorkspace(workspace)
      return
    }
    if (itemInfo.key === 'delete' && workspace.data) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDeleteWorkspace(workspace.data!),
      })
    }
  }

  /** 菜单「重命名」：将该行标为 editing，由 labelRender 显示输入框 */
  function startRenameWorkspace(workspace: WorkspaceConversationItem): void {
    if (hasEditingWorkspace()) {
      return
    }
    workspace.label = workspace.data?.name ?? String(workspace.label ?? '')
    workspace.editing = true
    workspace.disabled = true
  }

  async function doDeleteWorkspace(entity: AgentWorkspaceEntity): Promise<void> {
    loading.value = true
    try {
      const result: RestResult<void> = await AgentService.deleteWorkspace([Number(entity.id)])
      message.success(result.message)
      await loadWorkspaces()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  async function loadWorkspaces(): Promise<void> {
    loading.value = true
    try {
      const result = await AgentService.my({number: 1})
      if (!isResultSuccess(result)) {
        return
      }
      agentChatContent.workspaces.value = (result.data.elements ?? []).map(toWorkspaceItem)
    } finally {
      loading.value = false
    }
  }

  /** 新建：在列表顶部插入 editing=true 的空行 */
  function startCreateWorkspace(): void {
    if (hasEditingWorkspace()) {
      return
    }
    agentChatContent.workspaces.value = [
      {
        key: String(crypto.randomUUID()),
        label: '',
        kind: AGENT_LIST_ITEM_KIND.WORKSPACE,
        editing: true,
        disabled: true,
        conversations: [],
      },
      ...agentChatContent.workspaces.value,
    ]
  }

  /**
   * 取消编辑：
   * - 新建（无 data.id）：从列表移除
   * - 重命名：退出 editing，还原名称
   */
  function cancelEditWorkspace(item: WorkspaceConversationItem): void {
    if (!item.data?.id) {
      agentChatContent.workspaces.value = agentChatContent.workspaces.value.filter(
        (row) => !(isConversationItem(row) && row.key === item.key),
      )
      return
    }
    item.editing = false
    item.disabled = false
    item.label = item.data.name
  }

  /** 确定：创建或更新都走 saveWorkspace */
  async function confirmEditWorkspace(item: WorkspaceConversationItem): Promise<void> {
    const name = String(item.label ?? '').trim()
    if (!name || loading.value) {
      return
    }
    loading.value = true
    try {
      const result = await AgentService.saveWorkspace({
        id: item.data?.id,
        version: item.data?.version,
        name,
        operateCategory: item.data?.operateCategory ?? DEFAULT_OPERATE_CATEGORY.CUSTOMIZE,
      })
      if (!isResultSuccess(result)) {
        return
      }
      const saved: AgentWorkspaceResponseBody = {
        id: result.data,
        version: item.data?.version,
        name,
        operateCategory: item.data?.operateCategory ?? DEFAULT_OPERATE_CATEGORY.CUSTOMIZE,
        conversations: item.data?.conversations ?? item.conversations ?? [],
      }
      item.key = String(saved.id)
      item.label = saved.name
      item.group = String(saved.id)
      item.kind = AGENT_LIST_ITEM_KIND.WORKSPACE
      item.data = saved
      item.conversations = item.conversations ?? []
      item.editing = false
      item.disabled = false
      if (result.message) {
        message.success(result.message)
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadWorkspaces()
  })

  return {
    items,
    groupable,
    menuConfig,
    loading,
    startCreateWorkspace,
    cancelEditWorkspace,
    confirmEditWorkspace,
  }
}
