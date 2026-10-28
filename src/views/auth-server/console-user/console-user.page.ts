import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {ConsoleUserService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_CONSOLE_USER_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

const consoleUserService = new ConsoleUserService()

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
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime',format: 'dateTime'},
    remark: {labelKey: 'common.remark'},
  },
}
