import {defineHomePage, iconNameCell} from '@loncra/antdv-pro'
import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {
  AUTH_SERVER_ENTERPRISE_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {defineSearchProps, renderIconFont} from '@/utils'
import {enterpriseCore} from './enterprise.page'

/** 企业列表（`Home.vue`）。核心在 `enterprise.page.ts`，这里只写列表形态。 */
export const enterpriseHomePage = defineHomePage<EnterprisePayload, EnterpriseEntity>(
  enterpriseCore,
  {
    authority: {detail: AUTH_SERVER_ENTERPRISE_AUTHORITY.PAGE},
    enums: [{module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.YES_OR_NO]}],
    rowSelection: false,
    columns: [
      {
        key: 'name',
        width: 240,
        // 名称前带企业图标：布局在 pro（`iconNameCell`），图标怎么画由宿主注入
        render: iconNameCell({
          renderIcon: renderIconFont,
          nameOf: (record) => record.name,
          iconOf: (record) => record.icon,
        }),
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
