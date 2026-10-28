import type {SkillPackageEntity, SkillPackageSavePayload} from '@loncra/client/ai'
import {AiSkillPackageService, SKILL_GROUP_CODE_PREFIX} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {SKILL_PACKAGE_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const skillPackageService = new AiSkillPackageService()

export const skillPackageCore: CrudPageCore<SkillPackageSavePayload, SkillPackageEntity> = {
  service: skillPackageService,
  i18nPrefix: 'aiServer.skillPackage',
  routes: {
    home: SKILL_PACKAGE_ROUTE.HOME,
    add: SKILL_PACKAGE_ROUTE.ADD,
    edit: SKILL_PACKAGE_ROUTE.EDIT,
    detail: SKILL_PACKAGE_ROUTE.DETAIL,
  },

  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.AI_SKILL_PACKAGE,

  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    packageKey: {labelKey: 'aiServer.skillPackage.packageKey'},
    icon: {labelKey: 'common.icon'},
    summary: {labelKey: 'aiServer.skillPackage.summary'},
    tags: {labelKey: 'aiServer.skillPackage.tags'},
    additionalInformation: {labelKey: 'aiServer.skillPackage.additionalInformation'},
    origin: {
      labelKey: 'aiServer.skillPackage.origin',
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
    defaultUpdatePolicy: {
      labelKey: 'aiServer.skillPackage.defaultUpdatePolicy',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM,
      },
    },
    sourceType: {
      labelKey: 'aiServer.skillPackage.sourceType',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM,
      },
    },
    executeStatus: {
      labelKey: 'common.executeStatus',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    latestVersion: {labelKey: 'aiServer.skillPackage.latestVersion'},
    category: {labelKey: 'common.group', format: 'dict', dictId: SKILL_GROUP_CODE_PREFIX},
  },
}
