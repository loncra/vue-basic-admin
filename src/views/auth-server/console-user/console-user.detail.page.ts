import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {consoleUserCore} from './console-user.page'

/**
 * 控制台用户详情（`Detail.vue`）。核心在 `console-user.page.ts`，这里只写详情形态。
 *
 * 两个 `initialization.*` 项是**嵌套路径**：值从路径取，标签必须自己给 `labelKey`
 * （字典按字段名索引，回退标签会是 `前缀.路径`，没有意义）。
 */
export const consoleUserDetailPage = defineDetailPage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
    // 标题（`titleText`）没进 pro ⇒ 在 `Detail.vue` 用 `useEntityPageTitle` 拼 `(realName)`
    fields: [
      'id',
      'realName',
      'username',
      'email',
      'phoneNumber',
      'gender',
      'status',
      {
        key: 'lastAuthenticationTime',
      },
      {
        key: 'initialization.randomPassword',
        labelKey: 'authServer.randomPassword',
        format: 'enum',
      },
      {
        key: 'initialization.randomUsername',
        labelKey: 'authServer.randomUsername',
        format: 'enum',
      },
      'remark',
    ],
  },
)
