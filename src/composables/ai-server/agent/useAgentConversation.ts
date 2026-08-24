import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import {AgentService} from '@/apis/ai-server/agentService.ts'
import type {RestResult} from '@/types/apis'
import {createIcon, findFirstTreeNode, getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {AGENT_CHAT_STATUS, AGENT_CHAT_STATUS_STYLE, AGENT_CONVERSATION_TYPE} from '@/constants'
import useApp from 'antdv-next/dist/app/useApp'
import type {AgentChatStatus, AgentConversationItem} from "@/types/composables";
import type {MenuInfo} from "@v-c/menu";
import {type MenuItemType, type MenuProps} from "antdv-next";
import {useAgentChatContext} from "@/composables";

export function useAgentConversation(params:{
  onActivateConversation:(conversation:AgentConversationItem) => void
}) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const loading = ref<boolean>(false)

  const {message, modal} = useApp()

  const {activateConversation, conversations, conversationActive, menuOptions} = useAgentChatContext()
  /** 是否已有处于编辑态的工作空间行（同时只允许一条） */
  function getEditingConversationItem(): AgentConversationItem | undefined {
    return conversations.value.find((item) => item.editing)
  }

  function createMenu(conversation: AgentConversationItem): MenuProps {
    const menu = {
      items: [] as MenuItemType[],
      onClick: (menuItem: MenuInfo) => onOperationMenuClick(menuItem, conversation),
    }
    if (getEnumValue(conversation.type) !== AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE) {
      menu.items.push(
        {
          label: globalProperties.$t('common.rename'),
          key: 'rename',
          icon: () => createIcon('loncra-pencil'),
        },
        {
          type: 'divider' as const,
        },
        {
          label: globalProperties.$t('common.delete.text'),
          key: 'delete',
          danger: true,
          icon: () => createIcon('loncra-archive-x'),
        },)
    }
    if (getEnumValue(conversation.type) !== AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION) {
      menu.items.unshift({
        label: globalProperties.$t('agent.creation'),
        key: 'creation',
        icon: () => createIcon('loncra-plus'),
      })
    }
    return menu
  }

  async function onOperationMenuClick(itemInfo: MenuInfo, conversation: AgentConversationItem) {
    if (itemInfo.key === 'rename') {
      startRenameWorkspace(conversation)
    } else if (itemInfo.key === 'delete' && conversation) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDelete(conversation!),
      })
    } else if (itemInfo.key === 'creation') {
      await activateConversation(conversation)
      params.onActivateConversation(conversation);
    }
  }

  /** 菜单「重命名」：将该行标为 editing，由 labelRender 显示输入框 */
  function startRenameWorkspace(conversation: AgentConversationItem): void {
    const editing = getEditingConversationItem()
    if (editing) {
      cancelEditWorkspace(editing)
    }
    conversation.original = conversation.name
    conversation.editing = true
  }

  async function doDelete(entity: AgentConversationItem): Promise<void> {
    loading.value = true
    try {
      const result: RestResult<void> = await AgentService.deleteConversation([Number(entity.id)])
      message.success(result.message)
      await loadWorkspaces()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  async function loadWorkspaces(switchItemId?: number): Promise<void> {
    loading.value = true
    try {
      const result = await AgentService.findConversation()
      conversations.value = (result.data || []) as AgentConversationItem[]

      let activate;
      if (!switchItemId) {
        activate = conversations.value
          .find(c => getEnumValue(c.type) === AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)
      } else {
        activate = conversations.value
          .find(c => c.id === switchItemId)
      }
      if (activate) {
        await activateConversation(activate)
        params.onActivateConversation(activate);
      }

    } finally {
      loading.value = false
    }
  }

  /** 新建：在列表顶部插入 editing=true 的空行 */
  function startCreateWorkspace(): void {
    const editing = getEditingConversationItem()
    if (editing) {
      return
    }
    conversations.value = [
      {
        key: String(crypto.randomUUID()),
        name: '',
        editing: true,
        type:AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE
      },
      ...conversations.value,
    ]
  }

  /**
   * 取消编辑：
   * - 新建（无 data.id）：从列表移除
   * - 重命名：退出 editing，还原名称
   */
  function cancelEditWorkspace(item: AgentConversationItem): void {
    if (item.id) {
      item.editing = false
      item.name = item.original
      delete item.original
    } else {
      conversations.value = conversations.value.filter(d => d.key !== item.key)
    }
  }

  /** 确定：创建或更新都走 saveWorkspace */
  async function confirmEditWorkspace(item: AgentConversationItem): Promise<void> {
    if (loading.value) {
      return
    }
    loading.value = true
    try {
      const result = await AgentService.saveConversation(item)
      item.editing = false
      message.success(result.message)
      await loadWorkspaces(result.data)
    } finally {
      loading.value = false
    }
  }

  function getAgentChatStatusStyle(status: unknown) {
    const value = Number(getEnumValue(status as number)) as AgentChatStatus
    return AGENT_CHAT_STATUS_STYLE[value] ?? AGENT_CHAT_STATUS_STYLE[AGENT_CHAT_STATUS.READY]
  }

  async function onConversationMenuClick(m:MenuInfo) {
    const item = findFirstTreeNode(s => String(s.id) === m.key, conversations.value)
    if (!item) {
      return
    }
    const conversation = item as AgentConversationItem
    await activateConversation(conversation)
    params.onActivateConversation(conversation);
  }

  onMounted(() => {
    void loadWorkspaces()
  })

  return {
    conversations,
    menuOptions,
    loading,
    onConversationMenuClick,
    getAgentChatStatusStyle,
    createMenu,
    startCreateWorkspace,
    cancelEditWorkspace,
    confirmEditWorkspace,
  }
}
