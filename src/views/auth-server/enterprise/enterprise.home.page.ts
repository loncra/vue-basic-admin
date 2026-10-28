import {defineHomePage} from '@loncra/antdv-pro'
import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {AUTH_SERVER_CONSOLE_USER_AUTHORITY, AUTH_SERVER_ENTERPRISE_AUTHORITY} from '@loncra/client/auth'
import type {ToolbarActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, exportCollectionToView, renderIconFont} from '@/utils'
import {enterpriseCore} from './enterprise.page'

async function exportEnterprises(ctx: ToolbarActionContext<EnterpriseEntity>): Promise<void> {
  await exportCollectionToView({
    service: enterpriseCore.service,
    query: ctx.query ?? {},
    records: ctx.selectedItems,
  })
}

export const enterpriseHomePage = defineHomePage<EnterprisePayload, EnterpriseEntity>(
  enterpriseCore,
  {
    authority: {detail: AUTH_SERVER_ENTERPRISE_AUTHORITY.PAGE},
    rowSelection: false,
    toolbarActions: [
      {
        id: 'export',
        permission: AUTH_SERVER_CONSOLE_USER_AUTHORITY.EXPORT,
        label: () => i18n.global.t('common.export.all'),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: exportEnterprises,
      },
    ],
    columns: [
      {
        key: 'name',
        width: 240,
        format: {name: 'iconName', args: {size: 'large'}},
        search: defineSearchProps('input'),
      },
      {key: 'ownerPrincipal', width: 200, search: defineSearchProps('input')},
      {key: 'enabled', width: 120, search: defineSearchProps('select')},
      {key: 'tenantId', width: 180, search: defineSearchProps('input')},
      {key: 'remark', width: 220},
      {key: 'disbandTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
      {key: 'creationTime', width: 210, format: 'dateTime', search: defineSearchProps('dateRange')},
    ],
  },
)
