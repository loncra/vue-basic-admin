import {h} from 'vue'
import type {TableProps} from 'antdv-next'
import type {EnterpriseInvitationSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_AUDIT_TYPE_VALUE} from '@loncra/client/auth'
import {CrudHomePage, defineFormPage, type PageFieldRenderContext} from '@loncra/antdv-pro'
import {DATE_TIME_FORMAT} from '@/constants'
import {enterpriseRoleHomePage} from '@/views/auth-server/enterprise-role/enterprise-role.home.page'
import {enterpriseInvitationCore} from './enterprise-invitation.page'

export function createEmptyForm(): EnterpriseInvitationSavePayload {
  return {
    id: null as unknown as number,
    expirationTime: null as unknown as number,
    auditType: AUTH_SERVER_AUDIT_TYPE_VALUE.AUTOMATIC,
    roleIds: [],
  }
}

export const enterpriseInvitationFormPage = defineFormPage(enterpriseInvitationCore, {
  createEntity: createEmptyForm,
  fields: [
    {
      key: 'expirationTime',
      component: 'date',
      props: {
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
        showTime: true,
        allowClear: true,
        class: 'w-full',
      },
    },
    {key: 'auditType', component: 'select', props: {class: 'w-full'}},
    {
      key: 'roleIds',
      col: {span: 24},
      rules: [{required: true, type: 'array'}],
      render: (ctx: PageFieldRenderContext<EnterpriseInvitationSavePayload>) =>
        h(CrudHomePage as never, {
          page: enterpriseRoleHomePage,
          plain: true,
          title: false,
          recordActions: false,
          query: {'filter_[enabled_eq]': '1'},
          rowSelection: {
            type: 'checkbox',
            fixed: true,
            selectedRowKeys: ctx.entity.roleIds,
            onChange: ((keys: unknown[]) => {
              ctx.entity.roleIds = keys as number[]
            }) as NonNullable<TableProps['rowSelection']>['onChange'],
          },
        }),
    },
    {
      key: 'subTitle',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
})
