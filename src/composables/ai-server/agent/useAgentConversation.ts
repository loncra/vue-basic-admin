import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  ConversationItemType,
  ConversationsItemMenu,
  ConversationsProps,
  ItemType,
} from '@antdv-next/x/dist/conversations/interface'
import {AgentService} from '@/apis/ai-server/agentService.ts'
import type {AgentWorkspaceEntity, RestResult} from '@/types/apis'
import {isResultSuccess} from '@/requests/http.ts'
import {createIcon, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {DEFAULT_OPERATE_CATEGORY, DEFAULT_PAGE_RESULT_VALUE} from '@/constants/systemConstant.ts'
import useApp from 'antdv-next/dist/app/useApp'
import type {MenuInfo} from '@v-c/menu'
import type {WorkspaceConversationItem} from "@/types/composables";


function toWorkspaceItem(workspace: AgentWorkspaceEntity): WorkspaceConversationItem {
  return {
    key: String(workspace.id),
    label: workspace.name,
    data: workspace,
    editing: false,
    dataSource:DEFAULT_PAGE_RESULT_VALUE
  }
}

function isConversationItem(item: ItemType): item is WorkspaceConversationItem {
  return !('type' in item && item.type === 'divider')
}

export function useAgentConversation() {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const items = ref<ItemType[]>([])
  const state = ref<{
    workspace: {loading: boolean}
    activeKey: string
  }>({
    workspace: {loading: false},
    activeKey: '',
  })

  const {message, modal} = useApp()

  /** 是否已有处于编辑态的工作空间行（同时只允许一条） */
  function hasEditingWorkspace(): boolean {
    return items.value.some((item) => isConversationItem(item) && item.editing)
  }

  const menuConfig: ConversationsProps['menu'] = function (conversation) {
    const item = conversation as WorkspaceConversationItem
    if (!item.data) {
      return undefined as unknown as ConversationsItemMenu
    }
    if (getEnumValue(item.data.operateCategory) === DEFAULT_OPERATE_CATEGORY.SYSTEM) {
      return undefined as unknown as ConversationsItemMenu
    }
    // 编辑中不展示菜单，避免重复进入编辑
    if (item.editing) {
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
      onClick: (menuItem) => onMenuClick(menuItem, item),
    }
  }

  function onMenuClick(itemInfo: MenuInfo, conversation: WorkspaceConversationItem): void {
    if (itemInfo.key === 'rename') {
      startRenameWorkspace(conversation)
      return
    }
    if (itemInfo.key === 'delete' && conversation.data) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDeleteWorkspace(conversation.data!),
      })
    }
  }

  /** 菜单「重命名」：将该行标为 editing，由 labelRender 显示输入框 */
  function startRenameWorkspace(conversation: WorkspaceConversationItem): void {
    if (hasEditingWorkspace()) {
      return
    }
    conversation.label = conversation.data?.name ?? String(conversation.label ?? '')
    conversation.editing = true
    conversation.disabled = true
  }

  async function doDeleteWorkspace(entity: AgentWorkspaceEntity): Promise<void> {
    state.value.workspace.loading = true
    try {
      const result: RestResult<void> = await AgentService.deleteWorkspace([Number(entity.id)])
      message.success(result.message)
      await loadWorkspaces()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.workspace.loading = false
    }
  }

  async function loadWorkspaces(): Promise<void> {
    state.value.workspace.loading = true
    try {
      const result = await AgentService.pageWorkspace({number: 1})
      if (!isResultSuccess(result)) {
        return
      }
      // 保留仍在编辑的新建行（尚无 id），其余用服务端列表覆盖
      const editingNew = items.value.find(
        (item) => isConversationItem(item) && item.editing && !item.data?.id,
      )
      items.value = [
        ...(editingNew ? [editingNew] : []),
        ...(result.data.elements ?? []).map(toWorkspaceItem),
      ]
    } finally {
      state.value.workspace.loading = false
    }
  }

  /** 新建：在列表顶部插入 editing=true 的空行 */
  function startCreateWorkspace(): void {
    if (hasEditingWorkspace()) {
      return
    }
    items.value = [
      {
        key: String(crypto.randomUUID()),
        label: '',
        editing: true,
        disabled: true,
      },
      ...items.value,
    ]
  }

  /**
   * 取消编辑：
   * - 新建（无 data.id）：从列表移除
   * - 重命名：退出 editing，还原名称
   */
  function cancelEditWorkspace(item: WorkspaceConversationItem): void {
    if (!item.data?.id) {
      items.value = items.value.filter(
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
    if (!name || state.value.workspace.loading) {
      return
    }
    state.value.workspace.loading = true
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
      const workspace: AgentWorkspaceEntity = {
        id: result.data,
        version: item.data?.version,
        name,
        operateCategory: item.data?.operateCategory ?? DEFAULT_OPERATE_CATEGORY.CUSTOMIZE,
      }
      item.key = String(workspace.id)
      item.label = workspace.name
      item.data = workspace
      item.editing = false
      item.disabled = false
      if (result.message) {
        message.success(result.message)
      }
    } finally {
      state.value.workspace.loading = false
    }
  }

  onMounted(() => {
    void loadWorkspaces()
  })

  return {
    items,
    menuConfig,
    state,
    startCreateWorkspace,
    cancelEditWorkspace,
    confirmEditWorkspace,
  }
}
