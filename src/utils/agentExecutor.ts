import {invoke} from '@tauri-apps/api/core'
import {SOCKET_EVENT_TYPE} from '@/constants'
import {isTauri} from '@/utils/common'
import {listLocalWorkspaces} from '@/utils/agentWorkspace'
import {useSocketStore} from '@/stores/socketStore'

type SocketStore = ReturnType<typeof useSocketStore>

let registered = false

export function registerAgentFilesystemExecutor(socketStore: SocketStore): void {
  if (!isTauri() || registered) {
    return
  }
  registered = true

  socketStore.ackSubscribe(SOCKET_EVENT_TYPE.AGENT_FILESYSTEM_REQUEST, async (payload, ack) => {
    try {
      const body = typeof payload === 'string' ? JSON.parse(payload) : payload
      const operation = body?.data?.operation
      const params = body?.data?.params ?? {}
      const scope = body?.data?.scope
      if (scope?.type === 'store') {
        ack(await invoke('agent_fs', {operation, params, scope: 'store', base: scope.base ?? '', roots: []}))
        return
      }
      const workspaces = await listLocalWorkspaces()
      const workspace = scope?.default
        ? workspaces.find(item => item.default)
        : workspaces.find(item => item.key === scope?.key)
      if (!workspace || workspace.roots.length === 0) {
        ack({status: 500, executeCode: '500', message: '工作空间不存在或未配置目录', data: null})
        return
      }
      ack(await invoke('agent_fs', {operation, params, scope: 'workspace', roots: workspace.roots}))
    } catch (error) {
      ack({
        status: 500,
        executeCode: '500',
        message: error instanceof Error ? error.message : String(error),
        data: null,
      })
    }
  })
}
