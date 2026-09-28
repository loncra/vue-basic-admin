import {h} from 'vue'
import {IconSelect} from '@loncra/antdv'
import {
  AI_SERVER_SKILL_SOURCE_TYPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type ManualSkillSourceMetadata,
  type SkillPackageEntity,
} from '@loncra/client/ai'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import {ICON_SELECT_AVATAR_MODE_VALUE} from '@/constants'
import {renderIconFont} from '@/utils'
import {skillPackageCore} from './skill-package.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue` 的 `:column`） */
const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

/**
 * 技能包详情（`Detail.vue`）。核心在 `skill-package.page.ts`，这里只写详情形态。
 *
 * 四处照旧：
 * - `origin` / `status` / `type` / `sourceType` 在核心字典里写 `format: 'enum'`（= `getEnumName`）
 *   ⇒ 不手写 `render`；`category` 是数据字典（`format: 'dict'`，值自带 `name`）⇒ 同样不手写；
 * - 图标沿用旧页面的 `IconSelect` 只读预览（值缺省是「输入模式 + 名称」，与旧页面一致）；
 * - `defaultUpdatePolicy` = 策略名 +（自动更新时）间隔值与单位 ⇒ `render`；
 * - **`executeStatus` 一律 `render: executeStatusCell()`**（全仓规矩：状态点 + 状态名，
 *   失败且有 `exception` 时套 tooltip）—— 旧页面那半 `getExecuteBadgeStatus + a-badge` 到此退役。
 *
 * 「Git 来源」与「文件列表」两块**不在声明里**：前者按 `sourceType` 整体显隐、后者是宿主组件
 * （`l-file-editor`）⇒ 照旧留在 `Detail.vue` 的 `#afterDescriptions` 里。
 */
export const skillPackageDetailPage = defineDetailPage(skillPackageCore, {
  column: COLUMN,
  /** 实体初值（照抄旧 `Detail.vue` 那坨 `ref<SkillPackageEntity>({...})`）：取数前就渲染 */
  createEntity: () => ({
    id: 0,
    version: 0,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    additionalInformation: '',
    origin: 0,
    status: 0,
    type: 0,
    icon: '',
    defaultUpdatePolicy: 0,
    sourceType: 0,
    metadata: {
      source: {type: AI_SERVER_SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata,
    },
  }),
  fields: [
    'id',
    'name',
    'packageKey',
    {
      key: 'icon',
      render: (_value, entity: SkillPackageEntity) =>
        h(IconSelect, {
          preview: true,
          iconRender: renderIconFont,
          value: entity.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + entity.name,
        }),
    },
    'category',
    'origin',
    'status',
    'type',
    'latestVersion',
    {
      key: 'defaultUpdatePolicy',
      render: (value, entity: SkillPackageEntity) => {
        const name = getEnumName(value)
        // `updatePolicyTime` 只在自动更新时有值（旧页面那个 `<template v-if>`）
        const time = (
          entity.metadata as {updatePolicyTime?: {value?: unknown; unit?: unknown}} | undefined
        )?.updatePolicyTime
        if (getEnumValue(value) !== AI_SERVER_SKILL_UPDATE_POLICY.AUTOMATIC || !time) {
          return name
        }
        return `${name} ${String(time.value ?? '')} ${getEnumName(time.unit)}`
      },
    },
    'sourceType',
    {key: 'executeStatus', render: executeStatusCell()},
    {key: 'summary', span: 3},
    {
      key: 'tags',
      span: 3,
      render: (_value, entity: SkillPackageEntity) => (entity.tags || []).join(','),
    },
    {key: 'additionalInformation', span: 3},
  ],
  /** 旧页面的 `postGetEntity`：保证 `metadata.source` 一定在（模板里要按 `sourceType` 取它） */
  postGetEntity: (entity: SkillPackageEntity) => {
    const record = entity
    if (!record.metadata) {
      record.metadata = {source: {type: AI_SERVER_SKILL_SOURCE_TYPE.MANUAL} as never}
    }
    if (!record.metadata.source) {
      record.metadata.source = {type: AI_SERVER_SKILL_SOURCE_TYPE.MANUAL} as never
    }
    return record
  },
})
