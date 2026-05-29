import type {RouteTitleMap} from '@/types/composables/common'

export default {
  message_server_batch_detail: () =>
    ['common.detail', {name: 'messageServer.batch.routePage'}] as const,
} satisfies RouteTitleMap
