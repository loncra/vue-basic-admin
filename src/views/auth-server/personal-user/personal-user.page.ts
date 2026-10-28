import type {PersonalUserEntity} from '@loncra/client/auth'
import {PersonalUserService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_PERSONAL_USER_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const personalUserService = new PersonalUserService()

export const personalUserCore: CrudPageCore<PersonalUserEntity> = {
  service: personalUserService,
  i18nPrefix: 'authServer.personalUser',
  routes: {
    home: AUTH_SERVER_PERSONAL_USER_ROUTE.HOME,
    detail: AUTH_SERVER_PERSONAL_USER_ROUTE.DETAIL
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.PERSONAL_USER,
  fields: {
    id: {labelKey: 'common.id'},
    nickname: {labelKey: 'common.realName'},
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
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime', format: 'dateTime'},
    promoCode: {labelKey: 'authServer.personalUser.promoCode'},
    tenantId: {labelKey: 'authServer.enterprise.tenantId'},
  },
}
