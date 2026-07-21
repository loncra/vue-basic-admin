import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import {AgentService} from '@/apis/ai-server/agentService.ts'
import type {RestResult} from '@/types/apis'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {AGENT_CONVERSATION_TYPE} from '@/constants'
import useApp from 'antdv-next/dist/app/useApp'
import type {AgentConversationItem} from "@/types/composables";
import type {MenuInfo} from "@v-c/menu";
import type {MenuProps} from "antdv-next";
import {useAgentChatContext} from "@/composables";

export function useAgentConversation() {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const loading = ref<boolean>(false)

  const {message, modal} = useApp()

  const {activateConversation} = useAgentChatContext()

  const conversations = ref<AgentConversationItem[]>([])

  /** 是否已有处于编辑态的工作空间行（同时只允许一条） */
  function getEditingConversationItem(): AgentConversationItem | undefined {
    return conversations.value.find((item) => item.editing)
  }

  function createMenu(conversation: AgentConversationItem): MenuProps {
    return {
      items: [
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
        },
      ],
      onClick: (menuItem: MenuInfo) => onOperationMenuClick(menuItem, conversation),
    }
  }

  function onOperationMenuClick(itemInfo: MenuInfo, conversation: AgentConversationItem): void {
    if (itemInfo.key === 'rename') {
      startRenameWorkspace(conversation)
      return
    }
    if (itemInfo.key === 'delete' && conversation) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDelete(conversation!),
      })
    }
  }

  /** 菜单「重命名」：将该行标为 editing，由 labelRender 显示输入框 */
  function startRenameWorkspace(conversation: AgentConversationItem): void {
    const editing = getEditingConversationItem()
    if (editing) {
      cancelEditWorkspace(editing)
    }
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

  async function loadWorkspaces(): Promise<void> {
    loading.value = true
    try {
      const result = await AgentService.findConversation()
      conversations.value = (result.data || []) as AgentConversationItem[]
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
      await loadWorkspaces()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void loadWorkspaces()
  })

  return {
    conversations,
    loading,
    onConversationMenuClick:activateConversation,
    createMenu,
    startCreateWorkspace,
    cancelEditWorkspace,
    confirmEditWorkspace,
  }
}
