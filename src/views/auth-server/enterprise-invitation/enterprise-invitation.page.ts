import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
} from '@loncra/client/auth'
import {EnterpriseInvitationService} from '@loncra/client/auth'
import {type CrudPageCore, dayjsFormat} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {
  AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

const enterpriseInvitationService = new EnterpriseInvitationService()

/** 角色：只显示名字，逗号分隔（列表与详情共用） */
export function roleNamesCell(_value: unknown, record: EnterpriseInvitationEntity) {
  return (record.roles ?? []).map((role) => role.name).join(', ')
}

/** 过期时间：空 = 永久（列表的 `format: 'dateTime'` 没地方写这个兜底文案；详情同款兜底） */
export function expirationCell(_value: unknown, record: EnterpriseInvitationEntity) {
  return record.expirationTime
    ? dayjsFormat(record.expirationTime, import.meta.env.VITE_APP_DATE_TIME_VALUE_FORMAT)
    : i18n.global.t('common.permanent')
}

/**
 * 企业邀请的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `enterprise-invitation.home.page.ts`，详情壳还在宿主旧 kit（`Detail.vue`）。
 */
export const enterpriseInvitationCore: CrudPageCore<
  EnterpriseInvitationSavePayload,
  EnterpriseInvitationEntity
> = {
  service: enterpriseInvitationService,
  i18nPrefix: 'authServer.enterpriseInvitation',
  routes: {detail: AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.DETAIL},
  /** 详情壳（`enterprise-invitation/Detail.vue`）用的操作轨迹表 */
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE_INVITATION,

  /**
   * 字段字典：`labelKey` / `format` / `enumRef` 只写一次，**列表与详情共用**。
   *
   * `labelKey` 是照抄旧页面的口径（`common.*` 与 `authServer.enterpriseInvitation.*`）—— 迁移时漏了，
   * 于是列表表头按兜底规则去查 `authServer.enterpriseInvitation.member` 这类**不存在的 key**、
   * 直接把 key 当表头显示（真 bug，2026-09-24 补回）。
   */
  fields: {
    id: {labelKey: 'common.id'},
    member: {
      labelKey: 'authServer.enterpriseInvitation.inviterPrincipal',
      // 是当前登录者邀请的就在名字后加「(我)」：`principalName` 一律开 `self`
      format: {name: 'principalName', args: {self: true}},
    },
    // 邀请状态：后端 `EnterpriseInvitationStatusEnum`（auth-server）
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        id: SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM,
      },
    },
    roles: {labelKey: 'authServer.enterpriseInvitation.roleId'},
    // 下面三样只有**表单形态**（发起邀请弹层）用：角色勾选（必填）、副标题、备注
    roleIds: {labelKey: 'authServer.userRole'},
    subTitle: {labelKey: 'common.subTitle'},
    remark: {labelKey: 'common.remark'},
    expirationTime: {labelKey: 'common.expiresTime', format: 'dateTime'},
    creationTime: {labelKey: 'common.creationTime', format: 'dateTime'},
    // 审核类型：后端 `AuditTypeEnum` —— **在 resource-server**（旧实现从 auth-server 取 ⇒ 下拉一直是空的）
    auditType: {
      labelKey: 'authServer.enterpriseInvitation.auditType',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM},
    },
    tenantId: {labelKey: 'authServer.enterprise.tenantId'},
  },
}
