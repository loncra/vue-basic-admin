import {renderIconFont} from '@/utils/commonUtils'
import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_CONSOLE_USER_AUTHORITY,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  AuthServerService
} from '@loncra/client/auth'
import type {RecordActionContext, ToolbarActionContext} from '@loncra/antdv-pro'
import {defineHomePage} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {isBusinessSuccess} from '@/requests'
import {defineSearchProps, exportCollectionToView} from '@/utils'
import {consoleUserCore} from './console-user.page'

async function exportConsoleUsers(ctx: ToolbarActionContext<ConsoleUserEntity>): Promise<void> {
  await exportCollectionToView({
    service: consoleUserCore.service,
    query: ctx.query ?? {},
    records: ctx.selectedItems,
  })
}

function resetPassword(ctx: RecordActionContext<ConsoleUserEntity>): void {
  const record = ctx.record
  if (!record?.id) {
    return
  }
  const id = String(record.id)
  ctx.app.modal.confirm({
    title: i18n.global.t('auth.adminResetPassword.confirmTitle'),
    content: i18n.global.t('auth.adminResetPassword.confirmSingle'),
    onOk: async () => {
      const result = await AuthServerService.adminResetPassword(
        AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
        id,
      )
      if (isBusinessSuccess(result)) {
        void ctx.app.message.success(
          i18n.global.t('auth.adminResetPassword.success', {password: String(result.data ?? '')})
        )
      }
    },
  })
}

export const consoleUserHomePage = defineHomePage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    authority: {
      add: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      edit: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      detail: AUTH_SERVER_CONSOLE_USER_AUTHORITY.GET,
      delete: AUTH_SERVER_CONSOLE_USER_AUTHORITY.DELETE,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    toolbarActions: [
      {
        id: 'export',
        permission: AUTH_SERVER_CONSOLE_USER_AUTHORITY.EXPORT,
        label: (ctx) =>
          ctx.selectedItems.length > 0
            ? i18n.global.t('common.export.selected', {count: ctx.selectedItems.length})
            : i18n.global.t('common.export.all'),
        icon: () => renderIconFont('loncra-download', 'align'),
        run: exportConsoleUsers,
      },
    ],
    columns: [
      {key: 'realName', width: 150, format: {name: 'principalName', args: {self: true}}, search: defineSearchProps('input')},
      {key: 'gender', width: 150, search: defineSearchProps('select')},
      {key: 'username', width: 300, search: defineSearchProps('input')},
      {key: 'status', width: 150, search: defineSearchProps('select')},
      {key: 'email', width: 150, search: defineSearchProps('input', {expression: 'eq'})},
      {key: 'phoneNumber', width: 150, search: defineSearchProps('number', {expression: 'eq'})},
      {
        key: 'lastAuthenticationTime',
        width: 210,
        search: defineSearchProps('dateRange'),
      },
    ],
    recordActions: () => [
      {
        id: 'resetPassword',
        danger: true,
        permission: AUTH_SERVER_SYSTEM_USER_AUTHORITY.ADMIN_RESET_PASSWORD,
        label: () => i18n.global.t('auth.adminResetPassword.text'),
        icon: () => renderIconFont('loncra-lock-open'),
        run: resetPassword,
      },
    ],
  },
)
