import type {RouteTitleMap} from '@/types/common'

export default {
  auth_server_console_user_edit: () =>
    ['common.edit', {name: 'authServer.consoleUser.routePage'}] as const,
  auth_server_console_user_add: () =>
    ['common.add', {name: 'authServer.consoleUser.routePage'}] as const,
  auth_server_console_user_detail: () =>
    ['common.detail', {name: 'authServer.consoleUser.routePage'}] as const,
} satisfies RouteTitleMap
