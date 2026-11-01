import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  message_server_batch_detail: () =>
    ['common.detail', {name: 'messageServer.batch.routePage'}] as const,
} satisfies RouteTitleMap
