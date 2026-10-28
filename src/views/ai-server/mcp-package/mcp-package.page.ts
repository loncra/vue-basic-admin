import type {McpPackageEntity, McpPackageSavePayload} from '@loncra/client/ai'
import {AiMcpPackageService, MCP_GROUP_CODE_PREFIX} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {MCP_PACKAGE_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const mcpPackageService = new AiMcpPackageService()

export const mcpPackageCore: CrudPageCore<McpPackageSavePayload, McpPackageEntity> = {
  service: mcpPackageService,
  i18nPrefix: 'aiServer.mcpPackage',
  routes: {
    home: MCP_PACKAGE_ROUTE.HOME,
    add: MCP_PACKAGE_ROUTE.ADD,
    edit: MCP_PACKAGE_ROUTE.EDIT,
    detail: MCP_PACKAGE_ROUTE.DETAIL,
  },

  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.AI_MCP_PACKAGE,

  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    icon: {labelKey: 'common.icon'},
    initializeTimeout: {labelKey: 'aiServer.mcpPackage.initializeTimeout'},
    summary: {labelKey: 'aiServer.mcpPackage.summary'},
    tags: {labelKey: 'aiServer.mcpPackage.tags'},
    additionalInformation: {labelKey: 'aiServer.mcpPackage.additionalInformation'},
    authMode: {
      labelKey: 'aiServer.mcpPackage.authMode',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_AUTH_MODE_ENUM,
      },
    },
    packageKey: {labelKey: 'aiServer.mcpPackage.packageKey'},
    origin: {
      labelKey: 'aiServer.mcpPackage.origin',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM,
      },
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.DATA_STATUS_ENUM,
      },
    },
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.AI_SERVER, id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM},
    },
    category: {labelKey: 'common.group', format: 'dict', dictId: MCP_GROUP_CODE_PREFIX},
    dynamicActivation: {
      labelKey: 'aiServer.mcpPackage.dynamicActivation',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
  },
}
