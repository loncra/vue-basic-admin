import type {SkillPackageEntity, SkillPackageSavePayload} from '@loncra/client/ai'
import {AiSkillPackageService} from '@loncra/client/ai'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

/**
 * 页面 service。声明用它取数；快照（`snapshot`）是**实例方法**，
 * 壳提交快照时也得用同一个实例 ⇒ 导出，不重复 `new`。
 */
export const skillPackageService = new AiSkillPackageService()

/**
 * 技能包的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 * 列表形态在 `skill-package.home.page.ts`；Form / Detail 还在宿主旧 kit。
 */
export const skillPackageCore: CrudPageCore<SkillPackageSavePayload, SkillPackageEntity> = {
  service: skillPackageService,
  i18nPrefix: 'aiServer.skillPackage',
  routes: {
    home: SKILL_PACKAGE_ROUTE.HOME,
    add: SKILL_PACKAGE_ROUTE.ADD,
    edit: SKILL_PACKAGE_ROUTE.EDIT,
    detail: SKILL_PACKAGE_ROUTE.DETAIL,
  },

  /** 字段字典：labelKey / format / enumRef / dictId 只写一次 */
  fields: {
    name: {labelKey: 'common.name'},
    packageKey: {labelKey: 'aiServer.skillPackage.packageKey'},
    // 来源：后端 `PackageOriginEnum`（ai-server）
    origin: {
      labelKey: 'aiServer.skillPackage.origin',
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
    // 默认更新策略：后端 `UpdatePolicyEnum`（resource-server）
    defaultUpdatePolicy: {
      labelKey: 'aiServer.skillPackage.defaultUpdatePolicy',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM,
      },
    },
    // 来源类型：后端 `SkillSourceTypeEnum`（ai-server）
    sourceType: {
      labelKey: 'aiServer.skillPackage.sourceType',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AI_SERVER,
        id: SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM,
      },
    },
    // 执行状态：后端 `ExecuteStatus`（resource-server）；显示由列上的徽标渲染负责
    executeStatus: {
      labelKey: 'common.executeStatus',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM,
      },
    },
    latestVersion: {labelKey: 'aiServer.skillPackage.latestVersion'},
    // 分组是数据字典（值是整条字典项，只给 code 时回查 `list.dictionaries` 预载的那份）
    category: {labelKey: 'common.group', format: 'dict', dictId: SKILL_GROUP_CODE_PREFIX},
  },
}
