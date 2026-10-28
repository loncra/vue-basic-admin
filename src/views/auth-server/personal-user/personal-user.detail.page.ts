import {defineDetailPage} from '@loncra/antdv-pro'
import {personalUserCore} from './personal-user.page'

const COLUMN = {xxxl: 4, xxl: 4, xl: 4, lg: 2, md: 2, sm: 1, xs: 1}

export const personalUserDetailPage = defineDetailPage(personalUserCore, {
  column: COLUMN,
  fields: [
    'id',
    'nickname',
    'username',
    'email',
    'phoneNumber',
    'gender',
    'status',
    'lastAuthenticationTime',
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
    'promoCode',
    'tenantId',
  ],
})
