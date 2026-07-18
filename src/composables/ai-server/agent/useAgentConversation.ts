import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  ConversationItemType, ConversationsItemMenu,
  ConversationsProps,
  ItemType
} from '@antdv-next/x/dist/conversations/interface'
import {AgentService} from '@/apis/ai-server/agentService.ts'
import type {AgentWorkspaceEntity, RestResult} from '@/types/apis'
import {isResultSuccess} from '@/requests/http.ts'
import {AGENT_WORKSPACE_DRAFT_KEY,} from '@/constants/aiConstant.ts'
import {createIcon, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {DEFAULT_OPERATE_CATEGORY} from "@/constants/systemConstant.ts";
import useApp from "antdv-next/dist/app/useApp";
import type {MenuInfo} from "@v-c/menu";

function toWorkspaceItem(workspace: AgentWorkspaceEntity): ConversationItemType {
  return {
    key: String(workspace.id),
    label: workspace.name,
    data: workspace,
  }
}

export function useAgentConversation() {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const items = ref<ItemType[]>([])

  const state = ref<{
    workspace: {
      loading:boolean,
      draftName:string
    }
    activeKey:string
  }>({
    workspace:{
      draftName:'',
      loading:false,
    },
    activeKey:''
  })

  const {message, modal} = useApp();

  const menuConfig: ConversationsProps["menu"] = function (conversation) {
    if (!conversation.data) {
      return undefined as unknown as ConversationsItemMenu
    }
    if (getEnumValue(conversation.data.operateCategory) === DEFAULT_OPERATE_CATEGORY.SYSTEM) {
      return undefined as unknown as ConversationsItemMenu
    }
    return {
      items:[
        {
          label: globalProperties.$t('common.rename'),
          key: "rename",
          icon: () => createIcon('loncra-pencil'),
        },
        {
          type: "divider",
        },
        {
          label: globalProperties.$t('common.delete.text'),
          key: "delete",
          danger:true,
          icon: () => createIcon('loncra-archive-x'),
        }
      ],
      onClick: (item) => onMenuClick(item, conversation.data),
    }
  }

  const creatingWorkspace = computed(() =>
    items.value.some((item) => 'key' in item && item.key === AGENT_WORKSPACE_DRAFT_KEY),
  )

  function onMenuClick(itemInfo:MenuInfo, entity: AgentWorkspaceEntity) {
    if (itemInfo.key === 'delete') {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDeleteWorkspace(entity)
      })
    }
  }

  async function doDeleteWorkspace(entity:AgentWorkspaceEntity) {
    state.value.workspace.loading = true
    try {
      const result:RestResult<void> = await AgentService.deleteWorkspace([Number(entity.id)])
      message.success(result.message)
      await loadWorkspaces();
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.workspace.loading = false
    }
  }

  function isWorkspaceDraft(item: ConversationItemType): boolean {
    return item.key === AGENT_WORKSPACE_DRAFT_KEY || item.edit
  }

  async function loadWorkspaces(): Promise<void> {
    state.value.workspace.loading = true
    try {
      const result = await AgentService.pageWorkspace({
        number: 1,
      })
      if (!isResultSuccess(result)) {
        return
      }
      const workspaces = result.data.elements ?? []
      const draft = items.value.find(
        (item) => 'key' in item && item.key === AGENT_WORKSPACE_DRAFT_KEY,
      )
      items.value = [
        ...(draft ? [draft] : []),
        ...workspaces.map(toWorkspaceItem),
      ]
    } finally {
      state.value.workspace.loading = false
    }

  }

  function startCreateWorkspace(): void {
    if (creatingWorkspace.value) {
      return
    }
    state.value.workspace.draftName = ''
    items.value = [
      {
        key: AGENT_WORKSPACE_DRAFT_KEY,
        label: '',
        disabled: true,
      },
      ...items.value,
    ]
  }

  function cancelCreateWorkspace(): void {
    items.value = items.value.filter(
      (item) => !('key' in item) || item.key !== AGENT_WORKSPACE_DRAFT_KEY,
    )
    state.value.workspace.draftName = ''
  }

  async function confirmCreateWorkspace(): Promise<void> {
    const name = state.value.workspace.draftName.trim()
    if (!name || state.value.workspace.loading) {
      return
    }
    state.value.workspace.loading = true
    try {
      const result = await AgentService.saveWorkspace({
        id: undefined,
        version: undefined,
        name,
        operateCategory:DEFAULT_OPERATE_CATEGORY.CUSTOMIZE,
      })
      if (!isResultSuccess(result)) {
        return
      }
      const workspace: AgentWorkspaceEntity = {
        id: result.data,
        version: undefined,
        name,
        operateCategory:DEFAULT_OPERATE_CATEGORY.CUSTOMIZE,
      }
      items.value = items.value.map((item) =>
        'key' in item && item.key === AGENT_WORKSPACE_DRAFT_KEY
          ? toWorkspaceItem(workspace)
          : item,
      )
      state.value.workspace.draftName = ''
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
    creatingWorkspace,
    isWorkspaceDraft,
    startCreateWorkspace,
    cancelCreateWorkspace,
    confirmCreateWorkspace,
  }
}
