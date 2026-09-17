import {renderIconFont} from '@loncra/antdv'
import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {AuthServerService} from '@/apis'
import {defineHomePage} from '@/components/basic/page'
import {
  AUTH_SERVER_CONSOLE_USER_AUTHORITY,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  SYSTEM_ENUM_TYPE,
} from '@/constants'
import {isBusinessSuccess} from '@/requests'
import {dateTimeFormat} from '@/utils'
import {consoleUserCore} from './console-user.page'

/**
 * 控制台用户列表（`Home.vue`）。核心在 `console-user.page.ts`，这里只写列表形态。
 *
 * 列的 `key` 一律写**实体字段名**：搜索的查询名由它拼（`filter_[realName_like]`）。
 * 旧实现那三个列写的是 snake_case（`real_name` / `phone_number` / `last_authentication_time`），
 * 后端不认这些字段 ⇒ 那三列的搜索一直是失效的，这里按实体字段名写。
 */
export const consoleUserHomePage = defineHomePage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    authority: {
      add: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      export: AUTH_SERVER_CONSOLE_USER_AUTHORITY.EXPORT,
      edit: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      detail: AUTH_SERVER_CONSOLE_USER_AUTHORITY.GET,
      delete: AUTH_SERVER_CONSOLE_USER_AUTHORITY.DELETE,
    },
    enums: [SYSTEM_ENUM_TYPE.GENDER_ENUM, SYSTEM_ENUM_TYPE.USER_STATUS_ENUM],
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {key: 'realName', width: 150, search: {component: 'input', expression: 'like'}},
      {key: 'gender', width: 150, search: {component: 'select', expression: 'eq'}},
      {key: 'username', width: 300, search: {component: 'input', expression: 'like'}},
      {key: 'status', width: 150, search: {component: 'select', expression: 'eq'}},
      {key: 'email', width: 150, search: {component: 'input', expression: 'eq'}},
      {key: 'phoneNumber', width: 150, search: {component: 'number', expression: 'eq'}},
      {
        key: 'lastAuthenticationTime',
        width: 210,
        render: (value) => dateTimeFormat(value as number),
        search: {component: 'dateRange', expression: 'between'},
      },
    ],
    rowActions: (ctx) => [
      {
        id: 'resetPassword',
        danger: true,
        permission: AUTH_SERVER_SYSTEM_USER_AUTHORITY.ADMIN_RESET_PASSWORD,
        label: () => ctx.t('auth.adminResetPassword.text'),
        icon: () => renderIconFont('loncra-lock-open'),
        run: (actionCtx) => {
          if (actionCtx.record?.id == null) {
            return
          }
          ctx.modal.confirm({
            title: ctx.t('auth.adminResetPassword.confirmTitle'),
            content: ctx.t('auth.adminResetPassword.confirmSingle'),
            onOk: async () => {
              const result = await AuthServerService.adminResetPassword(
                AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
                String(actionCtx.record!.id),
              )
              if (isBusinessSuccess(result)) {
                ctx.message.success(
                  ctx.t('auth.adminResetPassword.success', {password: String(result.data ?? '')}),
                  8,
                )
              }
            },
          })
        },
      },
    ],
  },
)
