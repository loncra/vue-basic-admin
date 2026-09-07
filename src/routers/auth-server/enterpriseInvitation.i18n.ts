import type {RouteTitleMap} from '@/types/composables/common'

export default {
  auth_server_enterprise_invitation_detail: () =>
    ['common.detail', {name: 'authServer.enterpriseInvitation.routePage'}] as const,
} satisfies RouteTitleMap
