import type {SmsMessageEntity} from '@loncra/client/message'
import {SmsMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_SMS_ROUTE, OPERATION_DATA_TRACE_TABLE} from '@/constants'

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
  routes: {home: MESSAGE_SERVER_SMS_ROUTE.HOME},
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.SMS_MESSAGE,

  /** 字段字典：labelKey / format 只写一次（照抄旧 `Detail.vue` 的 `$t` 键与 `dateTimeFormat`） */
  fields: {
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    channel: {labelKey: 'common.channel', format: 'enum'},
    type: {labelKey: 'common.type', format: 'enum'},
    phoneNumber: {labelKey: 'common.phoneNumber'},
    executeStatus: {labelKey: 'common.status', format: 'enum'},
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    remark: {labelKey: 'common.remark'},
    content: {labelKey: 'common.content'},
  },
}
