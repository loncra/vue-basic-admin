import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {EnterpriseRoleService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AUTH_SERVER_ENTERPRISE_ROLE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

export const enterpriseRoleService = new EnterpriseRoleService()

/**
 * 企业角色的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 *
 * 三个 v1 字段（`removable` / `modifiable` / `enabled`）是同一个枚举 ——
 * `YES_OR_NO`，**在 resource-server**（照抄旧 `Form.vue` 的取法）；
 * 显式 `labelKey` 也照抄旧页面（`authServer.role.*` 是这里的历史 key）。
 *
 * 字段字典里给了 `format: 'enum'` + `enumRef` ⇒ 列表形态必须给这三列配
 * `search: defineSearchProps('select')`（规则：有枚举来源的列要能下拉搜）——
 * 已经配在 `enterprise-role.home.page.ts` 里了。
 */
export const enterpriseRoleCore: CrudPageCore<EnterpriseRoleSavePayload, EnterpriseRoleEntity> = {
  service: enterpriseRoleService,
  i18nPrefix: 'authServer.enterpriseRole',
  routes: {
    home: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.HOME,
    add: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD,
    edit: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.EDIT,
    detail: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.DETAIL,
  },
  /** `Form.vue` / `Detail.vue` 在用（渲染操作轨迹）⇒ 写 */
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
