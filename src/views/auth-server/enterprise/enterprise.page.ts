import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {EnterpriseService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_ENTERPRISE_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

const enterpriseService = new EnterpriseService()

export const enterpriseCore: CrudPageCore<EnterprisePayload, EnterpriseEntity> = {
  service: enterpriseService,
  i18nPrefix: 'authServer.enterprise',
  routes: {home: AUTH_SERVER_ENTERPRISE_ROUTE.HOME, detail: AUTH_SERVER_ENTERPRISE_ROUTE.DETAIL},
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE,

  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    ownerPrincipal: {labelKey: 'authServer.enterprise.ownerPrincipal'},
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
    tenantId: {labelKey: 'authServer.enterprise.tenantId'},
    remark: {labelKey: 'common.remark'},
    disbandTime: {labelKey: 'authServer.enterprise.disbandTime', format: 'dateTime'},
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
  },
}
