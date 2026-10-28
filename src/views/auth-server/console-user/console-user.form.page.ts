import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_GENDER} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import {VALID_REGX} from '@/constants'
import {consoleUserCore} from './console-user.page'

export const consoleUserFormPage = defineFormPage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    createEntity: () => ({
      id: null as unknown as number,
      version: null as unknown as number,
      realName: '',
      gender: AUTH_SERVER_GENDER.UNKNOWN,
      phoneNumber: '',
      remark: '',
      email: '',
      username: '',
      status: 1,
      phoneNumberVerified: 0,
      emailVerified: 0,
      systemName: '',
    }),
    fields: [
      {key: 'realName', component: 'input', rules: [{required: true}]},
      {
        key: 'username',
        component: 'input',
        rules: [{required: true}],
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {
        key: 'email',
        component: 'input',
        rules: (ctx) => (ctx.entity?.id ? [] : [{type: 'email'}]),
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {
        key: 'phoneNumber',
        component: 'input',
        rules: (ctx) => [
          {type: 'string', pattern: VALID_REGX.PHONE_NUMBER, message: ctx.t('error.valid.phoneNumber')},
        ],
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {key: 'gender', component: 'select'},
      {key: 'status', component: 'select'},
    ],
    onReset: (ctx) => {
      const entity = ctx.entity?.value
      if (entity) {
        entity.resourceIds = []
        entity.roleIds = []
      }
    },
  },
)
