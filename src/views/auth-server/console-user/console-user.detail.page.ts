import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {consoleUserCore} from './console-user.page'

export const consoleUserDetailPage = defineDetailPage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
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
