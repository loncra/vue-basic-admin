import type {EnterpriseMemberEntity, EnterpriseMemberSavePayload} from '@loncra/client/auth'
import {EnterpriseMemberService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const enterpriseMemberService = new EnterpriseMemberService()

export const ENTERPRISE_MEMBER_VARIANT = {AUDIT: 'audit'} as const

export const enterpriseMemberCore: CrudPageCore<
  EnterpriseMemberSavePayload,
  EnterpriseMemberEntity
> = {
  service: enterpriseMemberService,
  i18nPrefix: 'authServer.enterpriseMember',
  routes: {
    home: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.HOME,
    detail: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE_MEMBER,
  fields: {
    realName: {labelKey: 'common.realName'},
    nickname: {labelKey: 'common.realName'},
    username: {labelKey: 'auth.account'},
    principal: {labelKey: 'authServer.enterpriseMember.principal'},
    gender: {
      labelKey: 'common.gender',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
    },
    role: {
      labelKey: 'authServer.enterpriseMember.role',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        id: SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_ROLE_ENUM,
      },
    },
    auditStatus: {
      labelKey: 'common.auditStatus',
      format: 'auditStatus',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM},
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.USER_STATUS_ENUM},
    },
    phoneNumber: {labelKey: 'common.phoneNumber'},
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime', format: 'dateTime'},
    remark: {labelKey: 'common.remark'},
  },
}
