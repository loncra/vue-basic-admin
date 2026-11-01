import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  auth_server_enterprise_member_detail: () =>
    ['common.detail', {name: 'authServer.enterpriseMember.routePage'}] as const,
} satisfies RouteTitleMap
