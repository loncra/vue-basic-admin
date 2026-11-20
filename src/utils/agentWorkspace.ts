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
import {
  type AgentConversationHost,
  type AgentConversationRecord,
  isDefaultWorkspace
} from '@loncra/antdv-chat-pro'
import type {ResolvedAction} from '@loncra/antdv-pro'
import {isTauri} from '@/utils/common'
import i18n from '@/i18n'
import {getEnumValue} from "@loncra/client";


const clientWorkspaceRecords: AgentConversationRecord[] = []

let clientHomePromise: Promise<string> | null = null

function resolveClientHome(): Promise<string> {
  if (clientHomePromise === null) {
    clientHomePromise = invoke<{clientHome: string}>('system_info').then(info => info.clientHome)
  }
  return clientHomePromise
}

export async function resolveAgentWorkspaceRoots(
  scope: {default?: boolean; key?: string} | undefined,
): Promise<string[]> {
  if (scope?.default) {
    return [await resolveClientHome()]
  }
  const workspace = clientWorkspaceRecords.find(
    item => (item.metadata as Record<string, unknown> | undefined)?.key === scope?.key,
  )
  const roots = (workspace?.metadata as Record<string, unknown> | undefined)?.[
    AGENT_WORKSPACE_METADATA_ROOTS
  ]
  if (!Array.isArray(roots) || roots.length === 0) {
    throw new Error('工作空间不存在或未配置目录')
  }
  return roots as string[]
}

async function pickLocalFolders(): Promise<string | null> {
  const selected = await open({directory: true, multiple: false} as const)
  return typeof selected === 'string' ? selected : null
}

function workspaceKind(item: AgentConversationRecord): string {
  return (item.metadata as Record<string, unknown> | undefined)?.[AGENT_WORKSPACE_METADATA_KIND] as string
}

function isClientWorkspaceItem(item: AgentConversationRecord): boolean {
  return workspaceKind(item) === AI_SERVER_EXECUTION_CHANNEL.CLIENT
}

/*async function loadConversations(): Promise<AgentConversationRecord[]> {
  if (!isTauri()) {
    return ((await AgentService.findConversation()).data || []) as AgentConversationRecord[]
  }
  const [server, local] = await Promise.all([
    AgentService.findConversation(),
    AgentService.findConversation({}, AI_SERVER_EXECUTION_CHANNEL.CLIENT),
  ])
  const localRecords = (local.data || []) as AgentConversationRecord[]
  clientWorkspaceRecords.splice(0, clientWorkspaceRecords.length, ...localRecords)
  return [...localRecords, ...((server.data || []) as AgentConversationRecord[])]
}*/

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
  /*conversationsLoader: loadConversations,*/
  displayName: (item) => {
    if (!isDefaultWorkspace(getEnumValue(item.type))) {
      return undefined
    }
    const key = `agent.workspace.default.${workspaceKind(item)}`
    return i18n.global.te(key) ? i18n.global.t(key) : item.name
  },
  iconTone: (item) => {
    if (!isClientWorkspaceItem(item)) {
      return undefined
    }

    return isDefaultWorkspace(getEnumValue(item.type)) ? 'warning' : ''
  },
  menuKeys: (item) => {
    if (!isClientWorkspaceItem(item)) {
      return undefined
    }
    return isDefaultWorkspace(getEnumValue(item.type)) ? ['create'] : ['create', 'delete']
  },
  onRemove: async (item) => {
    if (!isClientWorkspaceItem(item) || isDefaultWorkspace(getEnumValue(item.type))) {
      return isClientWorkspaceItem(item)
    }
    await AgentService.deleteConversation([String(item.id)], AI_SERVER_EXECUTION_CHANNEL.CLIENT)
    return true
  },
  workspaceActions: ({refresh}) => isTauri() ? [addLocalWorkspaceAction(refresh)] : [],
}
