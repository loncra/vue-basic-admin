import {renderIconFont} from '@/utils/commonUtils'
import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {defineHomePage, exportCollectionData} from '@loncra/antdv-pro'
import type {RecordActionContext, ToolbarActionContext} from '@loncra/antdv-pro'
import {AuthServerService} from '@/apis'
import {
  AUTH_SERVER_CONSOLE_USER_AUTHORITY,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
  RESOURCE_SERVER_USER_EXPORT_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import i18n from '@/i18n'
import {isBusinessSuccess} from '@/requests'
import router from '@/routers'
import {defineSearchProps} from '@/utils'
import {consoleUserCore} from './console-user.page'

/** 导出：选中了就导选中，没选就按当前查询条件导全部，导完去导出视图 */
async function exportConsoleUsers(ctx: ToolbarActionContext<ConsoleUserEntity>): Promise<void> {
  const result = await exportCollectionData({
    service: consoleUserCore.service,
    // 选中了就导选中，没选就按当前查询条件导全部（`exportCollectionData` 自己分流）
    query: ctx.query ?? {},
    records: ctx.selectedItems,
  })
  void ctx.app.message.success(result.message)
  void router.push({name: RESOURCE_SERVER_USER_EXPORT_ROUTE})
}

/** 重置密码：确认框 → 调接口 → 把后端生成的新密码提示出来 */
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

/**
 * 控制台用户列表（`Home.vue`）。核心在 `console-user.page.ts`，这里只写列表形态。
 *
 * 列的 `key` 一律写**实体字段名**：它既是取值路径，也是（没写 `queryName` 时）拼查询名的来源。
 * 拼的时候 pro 会把第一段转成**表字段名**（`realName` → `filter_[real_name_like]`、
 * `lastAuthenticationTime` → `filter_[last_authentication_time_between]`）—— 后端要的是表字段。
 */
export const consoleUserHomePage = defineHomePage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    authority: {
      add: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      edit: AUTH_SERVER_CONSOLE_USER_AUTHORITY.SAVE,
      detail: AUTH_SERVER_CONSOLE_USER_AUTHORITY.GET,
      delete: AUTH_SERVER_CONSOLE_USER_AUTHORITY.DELETE,
    },
    enums: [
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.GENDER_ENUM, SYSTEM_ENUM_TYPE.USER_STATUS_ENUM],
      },
    ],
    rowSelection: {fixed: true, type: 'checkbox'},
    /** 导出是**本业务自己的事**：pro 不预置导出动作，这里声明一个标题栏动作（实现见上方 `exportConsoleUsers`） */
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
      {key: 'realName', width: 150, search: defineSearchProps('input')},
      {key: 'gender', width: 150, search: defineSearchProps('select')},
      {key: 'username', width: 300, search: defineSearchProps('input')},
      {key: 'status', width: 150, search: defineSearchProps('select')},
      {key: 'email', width: 150, search: defineSearchProps('input', {expression: 'eq'})},
      {key: 'phoneNumber', width: 150, search: defineSearchProps('number', {expression: 'eq'})},
      {
        key: 'lastAuthenticationTime',
        width: 210,
        format: 'dateTime',
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
