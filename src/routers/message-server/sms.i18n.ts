import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  message_server_sms_send: () =>
    ['common.send',{name: 'messageServer.sms.routePage'}] as const,
  message_server_sms_detail: () =>
    ['common.detail',{name: 'messageServer.sms.routePage'}] as const,
} satisfies RouteTitleMap
