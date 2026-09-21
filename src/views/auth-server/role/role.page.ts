import type {Ref} from 'vue'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {RoleService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {AUTH_SERVER_ROLE_ROUTE} from '@/routers/auth-server/role'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  getEnumValue,
} from '@loncra/client/commons'

const roleService = new RoleService()

/**
 * 宿主形态名。console-user 表单把角色表当选择器用，传 `variant: ROLE_VARIANT.PICKER`，
 * 宿主 import 这个常量，别写字面量。
 */
export const ROLE_VARIANT = {PICKER: 'picker'} as const

/**
 * 把「sources 变化」翻译成资源表的查询条件，并让表重新取数。
 * 上下文里的 ref 由页面壳（role/Form.vue、role/Detail.vue）通过 contextExtra 注入。
 *
 * **没选来源时一个字都不查**（清空表格）—— 这是原来 `@change="sourceChange"` 的行为，
 * 别省掉这个分支，否则「新增角色」一进来就把全部资源列出来。
 *
 * 导出给 form / detail 两个形态用（只被单一形态用到的东西不要放这里）。
 */
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

/**
 * 角色页面的**核心**：三种形态共用，只写一次。
 * 形态内容在 `role.home.page.ts` / `role.form.page.ts` / `role.detail.page.ts`。
 */
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

  /** 字段字典：labelKey / format / enumRef 只写一次，三种形态共用 */
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
