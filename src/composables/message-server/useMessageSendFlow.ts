import type {
  BatchResponse,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult
} from '@/types/apis'
import {ResourceServerService} from '@/apis'
import type {Router} from 'vue-router'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from "@/constants";

/**
 * 加载消息服务侧发送表单常用枚举
 */
export async function loadMessageSendEnums() {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.MESSAGE_SERVER]: [{id: SYSTEM_ENUM_TYPE.SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM}, {id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM}],
  })
  const bucket = enums.data?.[SYSTEM_MODULE_NAME.MESSAGE_SERVER]
  return {
    typeOptions: (bucket?.[SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM] ?? []) as NameValueEnumMetadata<number>[],
    channelOptions: (bucket?.[SYSTEM_ENUM_TYPE.SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM] ?? []) as NameValueEnumMetadata<number>[],
  }
}

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
