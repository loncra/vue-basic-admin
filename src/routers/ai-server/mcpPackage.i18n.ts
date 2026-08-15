import type {RouteTitleMap} from '@/types/composables/common'

export default {
  ai_server_mcp_package_edit: () =>
    ['common.edit', {name: 'aiServer.mcpPackage.routePage'}] as const,
  ai_server_mcp_package_add: () =>
    ['common.add', {name: 'aiServer.mcpPackage.routePage'}] as const,
  ai_server_mcp_package_detail: () =>
    ['common.detail', {name: 'aiServer.mcpPackage.routePage'}] as const,
} satisfies RouteTitleMap
