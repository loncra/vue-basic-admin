import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {EnterpriseRoleService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_ENTERPRISE_ROLE_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const enterpriseRoleService = new EnterpriseRoleService()

export const enterpriseRoleCore: CrudPageCore<EnterpriseRoleSavePayload, EnterpriseRoleEntity> = {
  service: enterpriseRoleService,
  i18nPrefix: 'authServer.enterpriseRole',
  routes: {
    home: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.HOME,
    add: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD,
    edit: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.EDIT,
    detail: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE_ROLE,
  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    authority: {labelKey: 'authServer.authority'},
    removable: {
      labelKey: 'authServer.role.removable',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
    modifiable: {
      labelKey: 'authServer.role.modifiable',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
    remark: {labelKey: 'common.remark'},
  },
}
