import {defineHomePage} from '@loncra/antdv-pro'
import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {
  AUTH_SERVER_ENTERPRISE_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {defineSearchProps} from '@/utils'
import {enterpriseCore} from './enterprise.page'

/** 企业列表（`Home.vue`）。核心在 `enterprise.page.ts`，这里只写列表形态。 */
export const enterpriseHomePage = defineHomePage<EnterprisePayload, EnterpriseEntity>(
  enterpriseCore,
  {
    authority: {detail: AUTH_SERVER_ENTERPRISE_AUTHORITY.PAGE},
    rowSelection: false,
    columns: [
      {
        key: 'name',
        width: 240,
        // 名称前带企业图标：布局仍归 pro（`iconNameCell`），这里用宿主注册的 `iconName`
        // formatter；不传 `args.size` = Avatar 默认（32px，与改前一致）
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
