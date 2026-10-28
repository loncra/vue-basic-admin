import {ref} from 'vue'
import type {
  EnterpriseInvitationEntity,
  EnterpriseInvitationSavePayload,
} from '@loncra/client/auth'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_AUTHENTICATION_TYPE_PARAM,
  AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY
} from '@loncra/client/auth'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  enterpriseInvitationCore,
  expirationCell,
  roleNamesCell,
} from './enterprise-invitation.page'

export const invitationShare = ref({open: false, url: ''})

function invitationUrl(id: string | number): string {
  return `${import.meta.env.VITE_APP_SITE_URL}${import.meta.env.VITE_APP_ENTERPRISE_INVITATION_PATH}/${id}?${AUTH_SERVER_AUTHENTICATION_TYPE_PARAM}=${AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL}`
}

function shareInvitation(ctx: RecordActionContext<EnterpriseInvitationEntity>): void {
  const record = ctx.record
  if (record?.id == null) {
    return
  }
  invitationShare.value = {open: true, url: invitationUrl(record.id)}
}

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
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {key: 'member', width: 250, ellipsis: true},
      {key: 'status', width: 120, ellipsis: true, search: defineSearchProps('select')},
      {key: 'auditType', width: 120, ellipsis: true, search: defineSearchProps('select')},
      {key: 'roles', width: 180, ellipsis: true, render: roleNamesCell},
      {key: 'expirationTime', width: 210, render: expirationCell, search: defineSearchProps('dateRange')},
      {key: 'creationTime', width: 210, search: defineSearchProps('dateRange')},
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
