import type {RouteTitleMap} from '@/types/composables/common'

export default {
  auth_server_personal_user_detail: () =>
    ['common.detail', {name: 'authServer.personalUser.routePage'}] as const,
} satisfies RouteTitleMap
