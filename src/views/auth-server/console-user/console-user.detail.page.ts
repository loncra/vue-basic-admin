import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@/components/basic/page'
import {dateTimeFormat, getEnumName} from '@/utils'
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
    titleText: (title, entity) => `${title} (${entity.realName})`,
    fields: [
      'id',
      'realName',
      'username',
      'email',
      'phoneNumber',
      'gender',
      'status',
      {key: 'lastAuthenticationTime', render: (value) => dateTimeFormat(value as number)},
      {
        key: 'initialization.randomPassword',
        labelKey: 'authServer.randomPassword',
        render: (_value, entity) => getEnumName(entity.initialization.randomPassword),
      },
      {
        key: 'initialization.randomUsername',
        labelKey: 'authServer.randomUsername',
        render: (_value, entity) => getEnumName(entity.initialization.randomUsername),
      },
      'remark',
    ],
  },
)
