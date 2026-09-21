import {h} from 'vue'
import {Space} from 'antdv-next'
import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
} from '@loncra/client/auth'
import {EnterpriseInvitationService} from '@loncra/client/auth'
import {dayjsFormat, type CrudPageCore, UserAvatar as LUserAvatar} from '@loncra/antdv-pro'
import {AuthServerService} from '@/apis'
import i18n from '@/i18n'
import {
  AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

const enterpriseInvitationService = new EnterpriseInvitationService()

/** 邀请人：头像 + 显示名（**列表与详情共用**，所以放核心） */
export function inviterCell(_value: unknown, record: EnterpriseInvitationEntity) {
  return h(Space, null, () => [
    h(LUserAvatar, {user: record.member}),
    AuthServerService.getPrincipalNameByUserDetails(record.member),
  ])
}

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
   * 字段字典：枚举的 `format` / `enumRef` 只写一次（其余列没有要收进字典的东西：
   * `member` / `roles` / `expirationTime` 的显示是 `render`，`creationTime` 是 `format: 'dateTime'`）。
   */
  fields: {
    // 邀请状态：后端 `EnterpriseInvitationStatusEnum`（auth-server）
    status: {
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        id: SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM,
      },
    },
    // 审核类型：后端 `AuditTypeEnum` —— **在 resource-server**（旧实现从 auth-server 取 ⇒ 下拉一直是空的）
    auditType: {
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM},
    },
  },
}
