import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {ConsoleUserService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AUTH_SERVER_CONSOLE_USER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import i18n from '@/i18n'

const consoleUserService = new ConsoleUserService()

/**
 * 控制台用户的**核心**：三种形态共用，只写一次。
 * 形态内容在 `console-user.home.page.ts` / `console-user.form.page.ts` / `console-user.detail.page.ts`。
 */
export const consoleUserCore: CrudPageCore<ConsoleUserSavePayload, ConsoleUserEntity> = {
  service: consoleUserService,
  i18nPrefix: 'authServer.consoleUser',
  routes: {
    home: AUTH_SERVER_CONSOLE_USER_ROUTE.HOME,
    add: AUTH_SERVER_CONSOLE_USER_ROUTE.ADD,
    edit: AUTH_SERVER_CONSOLE_USER_ROUTE.EDIT,
    detail: AUTH_SERVER_CONSOLE_USER_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.CONSOLE_USER,

  /** 字段字典：labelKey / format / enumRef 只写一次，三种形态共用 */
  fields: {
    id: {labelKey: 'common.id'},
    realName: {labelKey: 'common.realName'},
    username: {labelKey: 'auth.account'},
    email: {labelKey: 'common.email'},
    phoneNumber: {labelKey: 'common.phoneNumber'},
    gender: {
      labelKey: 'common.gender',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.USER_STATUS_ENUM},
    },
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime'},
    remark: {labelKey: 'common.remark'},
  },
}
