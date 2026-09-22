import {ref} from 'vue'
import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE_PARAM,
  AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {
  enterpriseInvitationCore,
  expirationCell,
  inviterCell,
  roleNamesCell,
} from './enterprise-invitation.page'

/**
 * 分享二维码弹层：动作在声明里（`share`），所以状态也从这里导出，
 * 壳（`Home.vue`）只负责把它渲出来（`v-model:open` + `:url`），不碰业务。
 */
export const invitationShare = ref({open: false, url: ''})

/** 邀请链接：站点地址 + 邀请路径 + id + 认证类型（个人） */
function invitationUrl(id: string | number): string {
  return `${import.meta.env.VITE_APP_SITE_URL}${import.meta.env.VITE_APP_ENTERPRISE_INVITATION_PATH}/${id}?${AUTH_SERVER_AUTHENTICATION_TYPE_PARAM}=${AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL}`
}

/** 分享（行内动作）：把链接写进弹层状态 */
function shareInvitation(ctx: RecordActionContext<EnterpriseInvitationEntity>): void {
  const record = ctx.record
  if (record?.id == null) {
    return
  }
  invitationShare.value = {open: true, url: invitationUrl(record.id)}
}

/**
 * 企业邀请列表（`Home.vue`）。核心在 `enterprise-invitation.page.ts`，这里只写列表形态。
 *
 * 「审核类型」下拉的选项就是声明里的 `enums`：壳从 `crud-home-page` 暴露的 `buckets` 取，不另发请求。
 * 新增 / 编辑弹层不走路由 —— 壳在组件上绑 `@add` / `@edit` 接管 pro 的默认跳转；详情走 `routes.detail`。
 */
export const enterpriseInvitationHomePage = defineHomePage<
  EnterpriseInvitationSavePayload,
  EnterpriseInvitationEntity
>(
  enterpriseInvitationCore,
  {
    authority: {
      add: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.SAVE,
      edit: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.SAVE,
      delete: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.DELETE,
      detail: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.GET,
    },
    enums: [
      {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        ids: [SYSTEM_ENUM_TYPE.ENTERPRISE_INVITATION_STATUS_ENUM],
      },
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.AUDIT_TYPE_ENUM],
      },
    ],
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {key: 'member', width: 250, ellipsis: true, render: inviterCell},
      {key: 'status', width: 120, ellipsis: true, search: defineSearchProps('select')},
      {key: 'auditType', width: 120, ellipsis: true, search: defineSearchProps('select')},
      {key: 'roles', width: 180, ellipsis: true, render: roleNamesCell},
      {key: 'expirationTime', width: 210, render: expirationCell, search: defineSearchProps('dateRange')},
      {key: 'creationTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
    ],
    recordActions: [
      {
        id: 'share',
        permission: AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY.GET,
        label: () => i18n.global.t('common.share'),
        icon: () => renderIconFont('loncra-share'),
        run: shareInvitation,
      },
    ],
  },
)
