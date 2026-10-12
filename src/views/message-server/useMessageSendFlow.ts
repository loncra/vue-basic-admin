import type {BatchResponse} from '@loncra/client/message'
import type {Router} from 'vue-router'

/**
 * 发送成功后按单条/批量结果跳转列表或批次明细
 */
export function navigateAfterMessageSend(
  router: Router,
  data: unknown,
  listRouteName: string,
) {
  if (Array.isArray(data)) {
    router.push({name: listRouteName})
    return
  }
  if (data && typeof data === 'object' && 'batchId' in data) {
    const response = data as BatchResponse
    router.push({name: 'message_server_batch_detail', query: {id: String(response.batchId)}})
  }
}
