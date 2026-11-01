import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  auth_server_personal_user_detail: () =>
    ['common.detail', {name: 'authServer.personalUser.routePage'}] as const,
} satisfies RouteTitleMap
