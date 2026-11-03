import {h} from 'vue'
import {invoke} from '@tauri-apps/api/core'
import {open} from '@tauri-apps/plugin-dialog'
import {FolderAddOutlined} from '@antdv-next/icons'
import {
  AGENT_WORKSPACE_KIND_LOCAL,
  AGENT_WORKSPACE_METADATA_KIND,
  AI_SERVER_AGENT_CONVERSATION_TYPE,
  AgentService,
} from '@loncra/client/ai'
import type {AgentConversationEntity} from '@loncra/client/ai'
import type {AgentConversationHost, AgentConversationRecord} from '@loncra/antdv-chat-pro'
import type {ResolvedAction} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {isTauri} from '@/utils/common'

export interface LocalWorkspaceDto {
  key: string
  id?: number
  default: boolean
  nameKey?: string
  name?: string
  roots: string[]
  createdAt: number
}

export function isAgentWorkspaceDesktop(): boolean {
  return isTauri()
}

async function listLocalWorkspaces(): Promise<LocalWorkspaceDto[]> {
  return invoke<LocalWorkspaceDto[]>('list_workspaces')
}

async function addLocalWorkspace(key: string, name: string, roots: string[]): Promise<LocalWorkspaceDto> {
  return invoke<LocalWorkspaceDto>('add_workspace', {key, name, roots})
}

async function removeLocalWorkspace(key: string): Promise<void> {
  await invoke('remove_workspace', {key})
}

async function attachWorkspaceConversation(key: string, id: number): Promise<void> {
  await invoke('attach_workspace_conversation', {key, id})
}

async function pickLocalFolders(): Promise<string[] | null> {
  const selected = await open({directory: true, multiple: true})
  if (!selected) {
    return null
  }
  return Array.isArray(selected) ? selected : [selected]
}

function toConversationRecord(dto: LocalWorkspaceDto): AgentConversationRecord {
  return {
    key: dto.key,
    id: dto.id,
    type: AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE,
    name: dto.name,
    metadata: {
      [AGENT_WORKSPACE_METADATA_KIND]: AGENT_WORKSPACE_KIND_LOCAL,
      default: dto.default,
      nameKey: dto.nameKey,
      roots: dto.roots,
    },
    children: [],
  } as AgentConversationRecord
}

function isLocalWorkspaceItem(item: AgentConversationRecord): boolean {
  return (item.metadata as Record<string, unknown> | undefined)?.[AGENT_WORKSPACE_METADATA_KIND]
    === AGENT_WORKSPACE_KIND_LOCAL
}

function isLocalDefaultItem(item: AgentConversationRecord): boolean {
  return isLocalWorkspaceItem(item)
    && (item.metadata as Record<string, unknown>).default === true
}

async function loadConversations(): Promise<AgentConversationRecord[]> {
  const [server, local] = await Promise.all([AgentService.findConversation(), listLocalWorkspaces()])
  const serverList = (server.data || []) as AgentConversationRecord[]
  return [
    ...local.filter((dto) => dto.id == null).map(toConversationRecord),
    ...serverList,
  ]
}

function addLocalWorkspaceAction(refresh: () => Promise<void>): ResolvedAction {
  return {
    id: 'add-local-workspace',
    label: i18n.global.t('agent.workspace.addLocal'),
    icon: h(FolderAddOutlined),
    disabled: false,
    run: async () => {
      const roots = await pickLocalFolders()
      if (!roots || roots.length === 0) {
        return
      }
      const key = crypto.randomUUID()
      const name = roots[0]?.split(/[\\/]/).filter(Boolean).pop() ?? ''
      const dto = await addLocalWorkspace(key, name, roots)
      const entity: AgentConversationEntity = {
        type: AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE,
        name: dto.name,
        metadata: {
          [AGENT_WORKSPACE_METADATA_KIND]: AGENT_WORKSPACE_KIND_LOCAL,
          roots: dto.roots,
        },
      }
      const result = await AgentService.saveConversation(entity)
      await attachWorkspaceConversation(dto.key, Number(result.data))
      await refresh()
    },
  }
}

export const agentConversationHost: Partial<AgentConversationHost> = {
  conversationsLoader: loadConversations,
  displayName: (item) => (isLocalDefaultItem(item) ? i18n.global.t('agent.workspace.localDefault') : undefined),
  iconTone: (item) => {
    if (!isLocalWorkspaceItem(item)) {
      return undefined
    }
    return isLocalDefaultItem(item) ? 'warning' : ''
  },
  menuKeys: (item) => {
    if (!isLocalWorkspaceItem(item)) {
      return undefined
    }
    return isLocalDefaultItem(item) ? ['create'] : ['create', 'delete']
  },
  onRemove: async (item) => {
    if (!isLocalWorkspaceItem(item) || isLocalDefaultItem(item)) {
      return isLocalWorkspaceItem(item)
    }
    const local = await listLocalWorkspaces()
    const target = local.find((dto) =>
      (item.id != null && dto.id != null && Number(dto.id) === Number(item.id)) || dto.key === item.key,
    )
    if (target) {
      await removeLocalWorkspace(target.key)
    }
    return item.id == null
  },
  workspaceActions: ({refresh}) => [addLocalWorkspaceAction(refresh)],
}

