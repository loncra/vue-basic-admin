import type {RouteTitleMap} from '@/types/composables/common'

export default {
  auth_server_enterprise_role_add_child: () =>
    ['common.addChild', {name: 'authServer.enterpriseRole.routePage'}] as const,
  auth_server_enterprise_role_edit: () =>
    ['common.edit', {name: 'authServer.enterpriseRole.routePage'}] as const,
  auth_server_enterprise_role_add: () =>
    ['common.add', {name: 'authServer.enterpriseRole.routePage'}] as const,
  auth_server_enterprise_role_detail: () =>
    ['common.detail', {name: 'authServer.enterpriseRole.routePage'}] as const,
} satisfies RouteTitleMap
