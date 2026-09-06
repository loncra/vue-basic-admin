import type {RouteTitleMap} from '@/types/composables/common'

export default {
  auth_server_enterprise_detail: () =>
    ['common.detail', {name: 'authServer.enterprise.routePage'}] as const,
} satisfies RouteTitleMap
