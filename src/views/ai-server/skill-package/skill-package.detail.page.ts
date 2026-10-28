import {h} from 'vue'
import {ICON_SELECT_AVATAR_MODE_VALUE, IconSelect} from '@loncra/antdv'
import {
  AI_SERVER_SKILL_SOURCE_TYPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type ManualSkillSourceMetadata,
  type SkillPackageEntity,
} from '@loncra/client/ai'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import {renderIconFont} from '@/utils'
import {skillPackageCore} from './skill-package.page'

const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

export const skillPackageDetailPage = defineDetailPage(skillPackageCore, {
  column: COLUMN,
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
          iconRender: (type: string) => renderIconFont(type, 'align'),
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
    {key: 'summary', span: 'filled'},
    {
      key: 'tags',
      span: 'filled',
      render: (_value, entity: SkillPackageEntity) => (entity.tags || []).join(','),
    },
    {key: 'additionalInformation', span: 'filled'},
  ],
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
