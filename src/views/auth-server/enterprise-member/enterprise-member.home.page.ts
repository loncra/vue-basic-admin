import {ref} from 'vue'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  AuthServerService,
  type EnterpriseMemberEntity,
} from '@loncra/client/auth'
import {
  AUDIT_STATUS_VALUE,
  getEnumName,
  getEnumValue,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'
import {
  defineHomePage,
  type RecordActionContext,
  type RecordActionDefinition,
  type ToolbarActionContext,
  type ToolbarActionDefinition,
} from '@loncra/antdv-pro'
import {isBusinessSuccess} from '@/requests'
import i18n from '@/i18n'
import {usePrincipalStore} from '@/stores/principalStore'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  ENTERPRISE_MEMBER_VARIANT,
  enterpriseMemberCore,
  enterpriseMemberService
} from './enterprise-member.page'

export const enterpriseMemberAudit = ref<{
  selectedItems: EnterpriseMemberEntity[]
  open: boolean
  loading: boolean
  remark: string
}>({selectedItems: [], open: false, loading: false, remark: ''})

export const enterpriseMemberInvitation = ref<{open: boolean}>({open: false})

function isAudit(variant?: string): boolean {
  return variant === ENTERPRISE_MEMBER_VARIANT.AUDIT
}

function isSelf(record: EnterpriseMemberEntity): boolean {
  return usePrincipalStore().state.principal.id === record.id
}

function roleCell(_value: unknown, record: EnterpriseMemberEntity) {
  const extra = (record.roles ?? []).map((item) => item.name).join(',')
  return extra ? `${getEnumName(record.role)}, ${extra}` : getEnumName(record.role)
}

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

const editAction: RecordActionDefinition<EnterpriseMemberEntity> = {
  id: 'edit',
  enabled: (ctx) => getEnumValue(ctx.record!.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
}
const deleteAction: RecordActionDefinition<EnterpriseMemberEntity> = {
  id: 'delete',
  enabled: (ctx) => getEnumValue(ctx.record!.role) !== AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
}

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

export const memberManageToolbarActions: ToolbarActionDefinition<EnterpriseMemberEntity>[] = [
  {
    id: 'invitation',
    permission: AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.AUDIT,
    label: () => i18n.global.t('authServer.enterpriseInvitation.routePage'),
    icon: () => renderIconFont('loncra-share'),
    run: openInvitation,
  },
]

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
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled:
        getEnumValue((record as unknown as EnterpriseMemberEntity).role) ===
        AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER,
    }),
  },
  columns: [
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
      visible: (ctx) => !isAudit(ctx.variant),
      search: defineSearchProps('dateRange', {expression: 'between'}),
    },
  ],
  recordActions: memberManageRecordActions,
  toolbarActions: memberManageToolbarActions,
})

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
