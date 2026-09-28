import type {SmsMessageEntity} from '@loncra/client/message'
import {SmsMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  MESSAGE_SERVER_SMS_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

const smsMessageService = new SmsMessageService()

/**
 * 短信消息的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 *
 * 目前只有详情形态用（`sms.detail.page.ts`）—— 列表还是宿主手写的 `sms/Home.vue`，
 * 等它也搬过来时直接复用这份核心。
 */
export const smsCore: CrudPageCore<SmsMessageEntity> = {
  service: smsMessageService,
  i18nPrefix: 'messageServer.sms',
  routes: {
    home: MESSAGE_SERVER_SMS_ROUTE.HOME,
    detail: MESSAGE_SERVER_SMS_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.SMS_MESSAGE,

  /** 字段字典：labelKey / format 只写一次（照抄旧 `Detail.vue` 的 `$t` 键与 `dateTimeFormat`） */
  fields: {
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    // 渠道 / 类型 / 状态：显示靠值自带元数据，**搜索下拉的 options 靠这里的 `enumRef` 推导**
    // （旧表是在 `mounted` 里手拉三个枚举再 `applyColumnOptions`）
    channel: {
      labelKey: 'common.channel',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM},
    },
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    phoneNumber: {labelKey: 'common.phoneNumber'},
    executeStatus: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    remark: {labelKey: 'common.remark'},
    content: {labelKey: 'common.content'},
  },
}
