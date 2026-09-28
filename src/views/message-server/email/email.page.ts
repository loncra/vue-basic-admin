import type {EmailMessageEntity} from '@loncra/client/message'
import {EmailMessageService} from '@loncra/client/message'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  MESSAGE_SERVER_EMAIL_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

export const emailMessageService = new EmailMessageService()

/**
 * 邮件消息的**核心**：service / i18nPrefix / routes / 字段字典只写一次
 * （旧实现是 `components/message-server/EmailTable.vue` 里手写一份）。
 *
 * 与 `sms.page.ts` 同构：渠道这一列邮件没有，所以字典里也不放。
 */
export const emailCore: CrudPageCore<EmailMessageEntity> = {
  service: emailMessageService,
  i18nPrefix: 'messageServer.email',
  routes: {
    home: MESSAGE_SERVER_EMAIL_ROUTE.HOME,
    detail: MESSAGE_SERVER_EMAIL_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.EMAIL_MESSAGE,
  fields: {
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    executeStatus: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    title: {labelKey: 'common.title'},
    toEmail: {labelKey: 'common.email'},
    successTime: {labelKey: 'common.successTime', format: 'dateTime'},
    retryCount: {labelKey: 'common.retry.count'},
    retryTime: {labelKey: 'common.retry.time', format: 'dateTime'},
    exception: {labelKey: 'error.errorMessage'},
    // 下面四个只有**详情**形态用（旧 `Detail.vue` 手写的 descriptions 项），列表没有这几列
    fromEmail: {labelKey: 'messageServer.email.fromEmail'},
    remark: {labelKey: 'common.remark'},
    content: {labelKey: 'common.content'},
    attachmentList: {labelKey: 'attachment.text'},
  },
}
