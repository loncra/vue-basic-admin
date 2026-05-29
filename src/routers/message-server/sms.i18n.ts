import type {RouteTitleMap} from '@/types/composables/common'

export default {
  message_server_sms_send: () =>
    ['common.send',{name: 'messageServer.sms.routePage'}] as const,
} satisfies RouteTitleMap
