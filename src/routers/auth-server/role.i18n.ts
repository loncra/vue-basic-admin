import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  auth_server_role_add_child: () =>
    ['common.addChild', {name: 'authServer.role.routePage'}] as const,
  auth_server_role_edit: () =>
    ['common.edit', {name: 'authServer.role.routePage'}] as const,
  auth_server_role_add: () =>
    ['common.add', {name: 'authServer.role.routePage'}] as const,
  auth_server_role_detail: () =>
    ['common.detail', {name: 'authServer.role.routePage'}] as const,
} satisfies RouteTitleMap
