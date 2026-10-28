import type {PersonalUserEntity} from '@loncra/client/auth'
import {AUTH_SERVER_PERSONAL_USER_AUTHORITY} from '@loncra/client/auth'
import type {ToolbarActionContext} from '@loncra/antdv-pro'
import {defineHomePage} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, exportCollectionToView, renderIconFont} from '@/utils'
import {personalUserCore} from './personal-user.page'

async function exportPersonalUsers(ctx: ToolbarActionContext<PersonalUserEntity>): Promise<void> {
  await exportCollectionToView({
    service: personalUserCore.service,
    query: ctx.query ?? {},
    records: ctx.selectedItems,
  })
}

export const personalUserHomePage = defineHomePage<PersonalUserEntity>(personalUserCore, {
  authority: {detail: AUTH_SERVER_PERSONAL_USER_AUTHORITY.GET},
  rowSelection: {fixed: true, type: 'checkbox'},
  toolbarActions: [
    {
      id: 'export',
      permission: AUTH_SERVER_PERSONAL_USER_AUTHORITY.EXPORT,
      label: (ctx) =>
        ctx.selectedItems.length > 0
          ? i18n.global.t('common.export.selected', {count: ctx.selectedItems.length})
          : i18n.global.t('common.export.all'),
      icon: () => renderIconFont('loncra-download', 'align'),
      run: exportPersonalUsers,
    },
  ],
  columns: [
    {key: 'nickname', width: 150, ellipsis: true, format: {name: 'principalName', args: {self: true}}, search: defineSearchProps('input')},
    {key: 'gender', width: 150, ellipsis: true, search: defineSearchProps('select')},
    {key: 'username', width: 300, ellipsis: true, search: defineSearchProps('input')},
    {key: 'status', width: 150, ellipsis: true, search: defineSearchProps('select')},
    {
      key: 'email',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('input', {expression: 'eq'}),
    },
    {
      key: 'phoneNumber',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('number', {expression: 'eq'}),
    },
    {
      key: 'lastAuthenticationTime',
      width: 210,
      search: defineSearchProps('dateRange', {expression: 'between'}),
    },
  ],
})
