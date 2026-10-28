import type {Ref} from 'vue'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {RoleService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {AUTH_SERVER_ROLE_ROUTE} from '@/routers/auth-server/role'
import {
  getEnumValue,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@loncra/client/commons'

const roleService = new RoleService()

export const ROLE_VARIANT = {PICKER: 'picker'} as const

export function applySources(ctx: {extra: Record<string, unknown>}, sources: unknown): void {
  const values = (Array.isArray(sources) ? sources : []).map((item) => String(getEnumValue(item as never)))
  const query = ctx.extra.resourceQuery as Ref<Record<string, unknown>> | undefined
  if (query) {
    query.value['filter_[sources_jin]'] = values
  }
  const table = ctx.extra.resourceTable as
    | Ref<{fetchDataSource?: () => void; clearDataSource?: () => void} | undefined>
    | undefined
  if (values.length === 0) {
    table?.value?.clearDataSource?.()
    return
  }
  table?.value?.fetchDataSource?.()
}

export const roleCore: CrudPageCore<RoleSavePayload, RoleEntity> = {
  service: roleService,
  i18nPrefix: 'authServer.role',
  routes: {
    home: AUTH_SERVER_ROLE_ROUTE.HOME,
    add: AUTH_SERVER_ROLE_ROUTE.ADD,
    edit: AUTH_SERVER_ROLE_ROUTE.EDIT,
    detail: AUTH_SERVER_ROLE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ROLE,

  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    authority: {labelKey: 'authServer.authority'},
    sources: {
      labelKey: 'authServer.source',
      format: 'enumList',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM},
    },
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
