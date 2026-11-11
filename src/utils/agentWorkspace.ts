import {h} from 'vue'
import {invoke} from '@tauri-apps/api/core'
import {open} from '@tauri-apps/plugin-dialog'
import {FolderAddOutlined} from '@antdv-next/icons'
import type {AgentConversationEntity} from '@loncra/client/ai'
import {
  AGENT_WORKSPACE_METADATA_KIND,
  AGENT_WORKSPACE_METADATA_ROOTS,
  AgentService,
  AI_SERVER_AGENT_CONVERSATION_TYPE,
  AI_SERVER_EXECUTION_CHANNEL,
} from '@loncra/client/ai'
import type {AgentConversationHost, AgentConversationRecord} from '@loncra/antdv-chat-pro'
import type {ResolvedAction} from '@loncra/antdv-pro'
import {isTauri} from '@/utils/common'
import {getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'

export interface LocalWorkspaceDto {
  key: string
  default: boolean
  roots: string[]
  createdAt: number
}

export async function listLocalWorkspaces(): Promise<LocalWorkspaceDto[]> {
  return invoke<LocalWorkspaceDto[]>('list_workspaces')
}

async function removeLocalWorkspace(key: string): Promise<void> {
  await invoke('remove_workspace', {key})
}

async function pickLocalFolders(): Promise<string | null> {
  const selected = await open({directory: true, multiple: false} as const)
  return typeof selected === 'string' ? selected : null
}

function workspaceKind(item: AgentConversationRecord): string {
  const kind = (item.metadata as Record<string, unknown> | undefined)?.[AGENT_WORKSPACE_METADATA_KIND]
  return kind === AI_SERVER_EXECUTION_CHANNEL.CLIENT ? AI_SERVER_EXECUTION_CHANNEL.CLIENT : AI_SERVER_EXECUTION_CHANNEL.CLOUD
}

function isLocalWorkspaceItem(item: AgentConversationRecord): boolean {
  return workspaceKind(item) === AI_SERVER_EXECUTION_CHANNEL.CLIENT
}

function isDefaultWorkspaceItem(item: AgentConversationRecord): boolean {
  return getEnumValue(item.type) === AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE
}

async function loadConversations(): Promise<AgentConversationRecord[]> {
  if (!isTauri()) {
    return ((await AgentService.findConversation()).data || []) as AgentConversationRecord[]
  }
  const [server, local] = await Promise.all([
    AgentService.findConversation(),
    AgentService.findConversation({}, AI_SERVER_EXECUTION_CHANNEL.CLIENT),
  ])
  return [...((local.data || []) as AgentConversationRecord[]), ...((server.data || []) as AgentConversationRecord[])]
}

function addLocalWorkspaceAction(refresh: () => Promise<void>): ResolvedAction {
  return {
    id: 'add-local-workspace',
    label: i18n.global.t('agent.workspace.addLocal'),
    icon: h(FolderAddOutlined),
    disabled: false,
    run: async () => {
      const root = await pickLocalFolders()
      if (!root) {
        return
      }
      const name = root.split(/[\\/]/).filter(Boolean).pop() ?? ''
      const key = crypto.randomUUID()
      await invoke('add_workspace', {key, roots: [root]})
      const entity = {
        type: AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE,
        name,
        metadata: {
          [AGENT_WORKSPACE_METADATA_KIND]: AI_SERVER_EXECUTION_CHANNEL.CLIENT,
          [AGENT_WORKSPACE_METADATA_ROOTS]: [root],
          default: false,
          key,
        },
      } as AgentConversationEntity
      await AgentService.saveConversation(entity, AI_SERVER_EXECUTION_CHANNEL.CLIENT)
      await refresh()
    },
  }
}

export const agentConversationHost: Partial<AgentConversationHost> = {
  conversationsLoader: loadConversations,
  displayName: (item) => {
    if (!isDefaultWorkspaceItem(item)) {
      return undefined
    }
    const key = `agent.workspace.default.${workspaceKind(item)}`
    return i18n.global.te(key) ? i18n.global.t(key) : item.name
  },
  iconTone: (item) => {
    if (!isLocalWorkspaceItem(item)) {
      return undefined
    }
    return isDefaultWorkspaceItem(item) ? 'warning' : ''
  },
  menuKeys: (item) => {
    if (!isLocalWorkspaceItem(item)) {
      return undefined
    }
    return isDefaultWorkspaceItem(item) ? ['create'] : ['create', 'delete']
  },
  onRemove: async (item) => {
    if (!isLocalWorkspaceItem(item) || isDefaultWorkspaceItem(item)) {
      return isLocalWorkspaceItem(item)
    }
    await AgentService.deleteConversation([String(item.id)], AI_SERVER_EXECUTION_CHANNEL.CLIENT)
    const key = (item.metadata as Record<string, unknown>).key
    if (key) {
      await removeLocalWorkspace(String(key))
    }
    return true
  },
  workspaceActions: ({refresh}) => [addLocalWorkspaceAction(refresh)],
}
