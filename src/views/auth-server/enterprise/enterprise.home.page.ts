import {defineHomePage, iconNameCell} from '@loncra/antdv-pro'
import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {EnterpriseService} from '@loncra/client/auth'
import {
  AUTH_SERVER_ENTERPRISE_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {defineSearchProps, renderIconFont} from '@/utils'

/** 企业列表（`Home.vue`）。 */
export const enterpriseHomePage = defineHomePage<EnterprisePayload, EnterpriseEntity>(
  {
    service: new EnterpriseService(),
    i18nPrefix: 'authServer.enterprise',
    routes: {detail: AUTH_SERVER_ENTERPRISE_ROUTE.DETAIL},
  },
  {
    authority: {detail: AUTH_SERVER_ENTERPRISE_AUTHORITY.PAGE},
    enums: [{module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.YES_OR_NO]}],
    rowSelection: false,
    columns: [
      {
        key: 'name',
        labelKey: 'common.name',
        width: 240,
        // 名称前带企业图标：布局在 pro（`iconNameCell`），图标怎么画由宿主注入
        render: iconNameCell({
          renderIcon: renderIconFont,
          nameOf: (record) => record.name,
          iconOf: (record) => record.icon,
        }),
        search: defineSearchProps('input'),
      },
      {
        key: 'ownerPrincipal',
        labelKey: 'authServer.enterprise.ownerPrincipal',
        width: 200,
        search: defineSearchProps('input'),
      },
      {
        key: 'enabled',
        labelKey: 'common.enabled',
        width: 120,
        format: 'enum',
        enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
        search: defineSearchProps('select'),
      },
      {
        key: 'tenantId',
        labelKey: 'authServer.enterprise.tenantId',
        width: 180,
        search: defineSearchProps('input'),
      },
      {key: 'remark', labelKey: 'common.remark', width: 220},
      {
        key: 'disbandTime',
        labelKey: 'authServer.enterprise.disbandTime',
        width: 210,
        format: 'dateTime',
        search: defineSearchProps('dateRange'),
      },
      {
        key: 'creationTime',
        labelKey: 'common.creationTime',
        width: 210,
        format: 'dateTime',
        search: defineSearchProps('dateRange'),
      },
    ],
  },
)
