import dayjs from 'dayjs'
import type {AuditEventEntity} from '@loncra/client/auth'
import {defineHomePage} from '@loncra/antdv-pro'
import {defineSearchProps, postTimestampFormat} from '@/utils'
import i18n from '@/i18n'
import {authenticationCore} from './authentication.page'

export const authenticationHomePage = defineHomePage<AuditEventEntity, AuditEventEntity>(
  authenticationCore,
  {
    authority: {detail: 'perms[auth_server_audit_event:get]'},
    columns: [
      {
        key: 'timestamp',
        labelKey: 'Crud.operationTrace.time',
        width: 210,
        format: 'dateTime',
        search: {
          component: 'date',
          queryName: 'after',
          defaultValue: postTimestampFormat(dayjs().startOf('d')),
          props: () => ({
            allowClear: false,
            class: 'w-full',
            showTime: true,
            placeholder: i18n.global.t('search.placeholder.input'),
          }),
        },
      },
      {
        key: 'principal',
        labelKey: 'Crud.operationTrace.principal',
        width: 150,
        render: (_value, record) => record.data?.details?.metadata?.realName || record.principal,
        search: defineSearchProps('input', {
          queryName: 'filter_[principal_eq]_or_[data.details.metadata.realName_eq]',
        }),
      },
      {
        key: 'data.details.requestDetails.requestHeaders.x-device-identified',
        labelKey: 'authServer.deviceIdentified',
        width: 300,
      },
      {
        key: 'data.details.requestDetails.remoteAddress',
        labelKey: 'common.ip',
        width: 250,
        search: defineSearchProps('input', {
          queryName: 'filter_[data.details.requestDetails.remoteAddress_eq]',
        }),
      },
      {
        key: 'data.details.requestDetails.type',
        labelKey: 'common.type',
        width: 150,
        search: defineSearchProps('input', {expression: 'eq', queryName: 'filter_[type_eq]'}),
      },
      {
        key: 'data.details.requestDetails.requestHeaders.user-agent',
        labelKey: 'common.system',
        width: 150,
      },
    ],
  },
)
