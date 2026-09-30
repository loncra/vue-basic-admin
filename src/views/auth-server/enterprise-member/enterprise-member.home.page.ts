import {ref} from 'vue'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  type EnterpriseMemberEntity,
} from '@loncra/client/auth'
import {AUDIT_STATUS_VALUE, getEnumName, getEnumValue} from '@loncra/client/commons'
import {
  defineHomePage,
  type RecordActionContext,
  type RecordActionDefinition,
  type ToolbarActionContext,
  type ToolbarActionDefinition,
} from '@loncra/antdv-pro'
import {AuthServerService} from '@/apis'
import {isBusinessSuccess} from '@/requests'
import i18n from '@/i18n'
import {usePrincipalStore} from '@/stores/principalStore'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {
  ENTERPRISE_MEMBER_VARIANT,
  enterpriseMemberCore,
  enterpriseMemberService
} from './enterprise-member.page'

/**
 * 审核弹层的状态：动作（声明里）要打开**壳里的**弹层，所以状态从这里导出、壳只负责渲染
 * —— 与 `enterprise-invitation` 的分享弹层同款接缝。**两个壳（整页成员管理 / 邀请展开行）
 * 用的是同一份**，因为审核动作两处都有。
 */
export const enterpriseMemberAudit = ref<{
  selectedItems: EnterpriseMemberEntity[]
  open: boolean
  loading: boolean
  remark: string
}>({selectedItems: [], open: false, loading: false, remark: ''})

/**
 * 发起邀请的弹层状态（只有整页管理那侧用；弹层本身是宿主组件 `EnterpriseInvitationModal`）。
 *
 * ⚠️ 不再持实体（2026-09-30）：实体归**表单声明**（`createEntity` = `createEmptyForm`），
 * 且弹层每次打开重挂载 ⇒ 这里只记开关（旧表 `invitation()` 里那句"每次换一张空表单"由声明负责）。
 */
export const enterpriseMemberInvitation = ref<{open: boolean}>({open: false})

function isAudit(variant?: string): boolean {
  return variant === ENTERPRISE_MEMBER_VARIANT.AUDIT
}

/** 本人 / 超级管理员之外不能动（旧表用 `principal.id !== record.id` 判"重置密码"是否可见） */
function isSelf(record: EnterpriseMemberEntity): boolean {
  return usePrincipalStore().state.principal.id === record.id
}

/** 角色列：角色的枚举名 +（有多角色时）逗号分隔的角色名（旧表 `#bodyCell` 那段） */
function roleCell(_value: unknown, record: EnterpriseMemberEntity) {
  const extra = (record.roles ?? []).map((item) => item.name).join(',')
  return extra ? `${getEnumName(record.role)}, ${extra}` : getEnumName(record.role)
}

/** 只能审核"待审核"的那些（旧的 `getAuditSelectedEntities`） */
function auditable(items: EnterpriseMemberEntity[]) {
  return items.filter((item) => getEnumValue(item.auditStatus) === AUDIT_STATUS_VALUE.AUDITABLE)
}

function openAudit(items: EnterpriseMemberEntity[]): void {
  enterpriseMemberAudit.value.selectedItems = items
  enterpriseMemberAudit.value.open = true
}

function auditRecord(ctx: RecordActionContext<EnterpriseMemberEntity>): void {
  openAudit(ctx.record ? [ctx.record] : [])
}

function auditSelected(ctx: ToolbarActionContext<EnterpriseMemberEntity>): void {
  openAudit(auditable(ctx.selectedItems))
}

/** 重置密码：确认框 → 调接口 → 把新密码提示出来（旧表那段，改成走动作上下文的 `app`） */
function resetPassword(ctx: RecordActionContext<EnterpriseMemberEntity>): void {
  const id = ctx.record?.id
  if (id == null) {
    return
  }
  void ctx.app.modal.confirm({
    title: i18n.global.t('auth.adminResetPassword.confirmTitle'),
    content: i18n.global.t('auth.adminResetPassword.confirmSingle'),
    onOk: async () => {
      const result = await AuthServerService.adminResetPassword(
        AUTH_SERVER_AUTHENTICATION_TYPE.ENTERPRISE,
        String(id),
      )
      void ctx.app.message.success({
        content: i18n.global.t('auth.adminResetPassword.success', {
          password: String(result.data ?? ''),
        }),
        duration: 8,
      })
    },
  })
}

function openInvitation(): void {
  enterpriseMemberInvitation.value = {open: true}
}

/**
 * 企业成员列表（`enterprise-member/Home.vue`）。核心在 `enterprise-member.page.ts`，这里只写列表形态。
 *
 * 一个声明两种用法（旧 `EnterpriseMemberTable.vue` 的 `audit` prop）：
 * - **整页成员管理**（默认）：时间列在、工具栏是「邀请」、行内动作 = 编辑 / 删除 / 重置密码；
 * - **审核态**（`variant: ENTERPRISE_MEMBER_VARIANT.AUDIT`，邀请首页的展开行里）：隐藏时间列，
 *   动作换成下面导出的 `memberAudit*` 两组（**动作上下文里没有 `variant`** ⇒ 分形态只能由壳覆盖，
 *   所以两组都从本文件导出、由各自的壳传下去）。
 *
 * 跳转由声明里的 `routes.detail` 接管（旧表的 `@detail` 就是跳它）；审核态的壳会给
 * `:authority` 覆盖掉 `detail`（旧表 `detail: props.audit ? '' : GET` 那个意思）。
 */
/** 编辑 / 删除：企业主不能被改（旧表用 `enabled` 判，语义一样）—— 两态共用 */
const editAction: RecordActionDefinition<EnterpriseMemberEntity> = {
  id: 'edit',
  enabled: (ctx) => getEnumValue(ctx.record!.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
}
const deleteAction: RecordActionDefinition<EnterpriseMemberEntity> = {
  id: 'delete',
  enabled: (ctx) => getEnumValue(ctx.record!.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
}

/** 整页成员管理：编辑 / 删除 / 重置密码（不给"重置自己的密码"） */
export const memberManageRecordActions: RecordActionDefinition<EnterpriseMemberEntity>[] = [
  editAction,
  deleteAction,
  {
    id: 'resetPassword',
    danger: true,
    permission: AUTH_SERVER_SYSTEM_USER_AUTHORITY.ADMIN_RESET_PASSWORD,
    label: () => i18n.global.t('auth.adminResetPassword.text'),
    icon: () => renderIconFont('loncra-lock-open'),
    visible: (ctx) => !isSelf(ctx.record!),
    run: resetPassword,
  },
]

/** 整页成员管理的工具栏：发起邀请 */
export const memberManageToolbarActions: ToolbarActionDefinition<EnterpriseMemberEntity>[] = [
  {
    id: 'invitation',
    permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
    label: () => i18n.global.t('authServer.enterpriseInvitation.routePage'),
    icon: () => renderIconFont('loncra-share'),
    run: openInvitation,
  },
]

/** 审核态（邀请首页的展开行）：编辑 / 删除 / 审核单条 */
export const memberAuditRecordActions: RecordActionDefinition<EnterpriseMemberEntity>[] = [
  editAction,
  deleteAction,
  {
    id: 'audit',
    permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
    enabled: (ctx) =>
      getEnumValue(ctx.record?.auditStatus ?? 0) === AUDIT_STATUS_VALUE.AUDITABLE,
    label: () => i18n.global.t('common.audit.text'),
    icon: () => renderIconFont('loncra-vote'),
    run: auditRecord,
  },
]

/** 审核态的工具栏：审核选中的（只算"待审核"的那些） */
export const memberAuditToolbarActions: ToolbarActionDefinition<EnterpriseMemberEntity>[] = [
  {
    id: 'auditSelected',
    permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
    enabled: (ctx) => auditable(ctx.selectedItems).length > 0,
    label: (ctx) =>
      i18n.global.t('common.audit.selected', {count: auditable(ctx.selectedItems).length}),
    icon: () => renderIconFont('loncra-vote'),
    run: auditSelected,
  },
]

export const enterpriseMemberHomePage = defineHomePage(enterpriseMemberCore, {
  enums: [
    {
      module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
      ids: [SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM],
    },
  ],
  authority: {
    detail: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.GET,
    delete: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.DELETE,
  },
  rowSelection: {
    fixed: true,
    type: 'checkbox',
    // 企业主不能被勾选（旧表的 `getCheckboxProps`）
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled:
        getEnumValue((record as unknown as EnterpriseMemberEntity).role) ===
        AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
    }),
  },
  columns: [
    // 头像 + 名称 +「(我)」：宿主 `principalName` formatter，`args.self` 决定加不加「(我)」
    {key: 'realName', ellipsis: true, format: {name: 'principalName', args: {self: true}}},
    {key: 'gender', width: 120, ellipsis: true},
    {
      key: 'role',
      width: 120,
      ellipsis: true,
      render: roleCell,
      search: defineSearchProps('select', {expression: 'eq'}),
    },
    {
      key: 'auditStatus',
      width: 120,
      ellipsis: true,
      search: defineSearchProps('select', {expression: 'eq'}),
    },
    {
      key: 'status',
      width: 120,
      ellipsis: true,
      search: defineSearchProps('select', {expression: 'eq'}),
    },
    {key: 'phoneNumber', width: 150, ellipsis: true},
    {
      key: 'lastAuthenticationTime',
      width: 210,
      // 审核态不显示它（旧表按 `audit` 过滤掉这一列）
      visible: (ctx) => !isAudit(ctx.variant),
      search: defineSearchProps('dateRange', {expression: 'between'}),
    },
  ],
  recordActions: memberManageRecordActions,
  toolbarActions: memberManageToolbarActions,
})

/** 审核提交（弹层组件调它）：`service.audit(ids, {status, remark})`（旧表 `onAudit`） */
export async function submitAudit(status: number): Promise<string | undefined> {
  const audit = enterpriseMemberAudit.value
  audit.loading = true
  try {
    const ids = audit.selectedItems.map((item) => Number(item.id))
    const result = await enterpriseMemberService.audit(ids, {status, remark: audit.remark})
    return isBusinessSuccess(result) ? result.message : undefined
  } finally {
    audit.loading = false
  }
}

export function closeAudit(): void {
  enterpriseMemberAudit.value.selectedItems = []
  enterpriseMemberAudit.value.remark = ''
  enterpriseMemberAudit.value.open = false
}
