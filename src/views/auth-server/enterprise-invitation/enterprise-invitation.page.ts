import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
} from '@loncra/client/auth'
import {EnterpriseInvitationService} from '@loncra/client/auth'
import {type CrudPageCore, dayjsFormat} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

const enterpriseInvitationService = new EnterpriseInvitationService()

export function roleNamesCell(_value: unknown, record: EnterpriseInvitationEntity) {
  return (record.roles ?? []).map((role) => role.name).join(', ')
}

export function expirationCell(_value: unknown, record: EnterpriseInvitationEntity) {
  return record.expirationTime
    ? dayjsFormat(record.expirationTime, import.meta.env.VITE_APP_DATE_TIME_VALUE_FORMAT)
    : i18n.global.t('common.permanent')
}

export const enterpriseInvitationCore: CrudPageCore<
  EnterpriseInvitationSavePayload,
  EnterpriseInvitationEntity
> = {
  service: enterpriseInvitationService,
  i18nPrefix: 'authServer.enterpriseInvitation',
  routes: {detail: AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.DETAIL},
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE_INVITATION,

  fields: {
    id: {labelKey: 'common.id'},
    member: {
      labelKey: 'authServer.enterpriseInvitation.inviterPrincipal',
      format: {name: 'principalName', args: {self: true}},
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        id: SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM,
      },
    },
    roles: {labelKey: 'authServer.enterpriseInvitation.roleId'},
    roleIds: {labelKey: 'authServer.userRole'},
    subTitle: {labelKey: 'common.subTitle'},
    remark: {labelKey: 'common.remark'},
    expirationTime: {labelKey: 'common.expiresTime', format: 'dateTime'},
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    auditType: {
      labelKey: 'authServer.enterpriseInvitation.auditType',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM},
    },
    tenantId: {labelKey: 'authServer.enterprise.tenantId'},
  },
}
