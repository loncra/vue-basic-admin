import type {McpPackageEntity, McpPackageSavePayload} from '@loncra/client/ai'
import {AiMcpPackageService} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  MCP_GROUP_CODE_PREFIX,
  MCP_PACKAGE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

/**
 * 页面 service。声明用它取数；列表动作（`release` / `revoke`）是**实例方法**，
 * 也得用同一个实例 ⇒ 导出给 `mcp-package.home.page.ts`，不重复 `new`。
 */
export const mcpPackageService = new AiMcpPackageService()

/**
 * MCP 包的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `mcp-package.home.page.ts`；Form / Detail 还在宿主旧 kit。
 */
export const mcpPackageCore: CrudPageCore<McpPackageSavePayload, McpPackageEntity> = {
  service: mcpPackageService,
  i18nPrefix: 'aiServer.mcpPackage',
  routes: {
    home: MCP_PACKAGE_ROUTE.HOME,
    add: MCP_PACKAGE_ROUTE.ADD,
    edit: MCP_PACKAGE_ROUTE.EDIT,
    detail: MCP_PACKAGE_ROUTE.DETAIL,
  },

  /** 字段字典：labelKey / format / enumRef / dictId 只写一次 */
  fields: {
    name: {labelKey: 'common.name'},
    // 认证方式：后端 `McpPackageAuthModeEnum`（ai-server）
    authMode: {
      labelKey: 'aiServer.mcpPackage.authMode',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_AUTH_MODE_ENUM,
      },
    },
    packageKey: {labelKey: 'aiServer.mcpPackage.packageKey'},
    // 来源：后端 `PackageOriginEnum`（ai-server）
    origin: {
      labelKey: 'aiServer.mcpPackage.origin',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM,
      },
    },
    // 状态：后端 `DataStatusEnum`（resource-server）
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM,
      },
    },
    // 包类型：后端 `PackageTypeEnum`（ai-server）
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.AI_SERVER, id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM},
    },
    // 分组是数据字典（值是整条字典项，只给 code 时回查 `list.dictionaries` 预载的那份）
    category: {labelKey: 'common.group', format: 'dict', dictId: MCP_GROUP_CODE_PREFIX},
    // 动态激活：后端 `YesOrNo`（resource-server）
    dynamicActivation: {
      labelKey: 'aiServer.mcpPackage.dynamicActivation',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
  },
}
