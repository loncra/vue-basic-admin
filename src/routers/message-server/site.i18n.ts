import type {RouteTitleMap} from '@/types/composables/common'

export default {
  message_server_site_send: () =>
    ['common.send',{name: 'messageServer.site.routePage'}] as const,
  message_server_site_detail: () =>
    ['common.detail',{name: 'messageServer.site.routePage'}] as const,
} satisfies RouteTitleMap
