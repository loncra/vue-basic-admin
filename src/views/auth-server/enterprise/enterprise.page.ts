import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {EnterpriseService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AUTH_SERVER_ENTERPRISE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

const enterpriseService = new EnterpriseService()

/**
 * 企业页面的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `enterprise.home.page.ts`，详情形态在 `enterprise.detail.page.ts`。
 */
export const enterpriseCore: CrudPageCore<EnterprisePayload, EnterpriseEntity> = {
  service: enterpriseService,
  i18nPrefix: 'authServer.enterprise',
  /** `home` 给详情壳的 `usePageExit` 用（记录被删 ⇒ 回列表 + 关 tab） */
  routes: {home: AUTH_SERVER_ENTERPRISE_ROUTE.HOME, detail: AUTH_SERVER_ENTERPRISE_ROUTE.DETAIL},
  /** 详情壳用的操作轨迹表 */
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE,

  /** 字段字典：labelKey / format / enumRef 只写一次 */
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
