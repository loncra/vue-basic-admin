import type {RouteTitleMap} from '@/types/composables/common'

export default {
  auth_server_enterprise_member_detail: () =>
    ['common.detail', {name: 'authServer.enterpriseMember.routePage'}] as const,
} satisfies RouteTitleMap
