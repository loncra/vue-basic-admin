import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  auth_server_enterprise_detail: () =>
    ['common.detail', {name: 'authServer.enterprise.routePage'}] as const,
} satisfies RouteTitleMap
