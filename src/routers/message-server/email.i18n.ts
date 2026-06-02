import type {RouteTitleMap} from '@/types/composables/common'

export default {
  message_server_email_send: () =>
    ['common.send',{name: 'messageServer.email.routePage'}] as const,
  message_server_email_detail: () =>
    ['common.detail',{name: 'messageServer.email.routePage'}] as const,
} satisfies RouteTitleMap
