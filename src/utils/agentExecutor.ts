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
      const workspaces = await listLocalWorkspaces()
      const roots = workspaces.flatMap(item => item.roots)
      ack(await invoke('agent_fs', {operation, params, roots}))
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
