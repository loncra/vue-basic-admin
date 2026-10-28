import {h, nextTick, ref} from 'vue'
import {InputNumber, Select, SpaceAddon, SpaceCompact} from 'antdv-next'
import type {NameValueEnumMetadata, RestResult} from '@loncra/client/commons'
import {
  getEnumValue,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE
} from '@loncra/client/commons'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import {
  AI_SERVER_SKILL_SOURCE_TYPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type GitSkillSourceMetadata,
  type ManualSkillSourceMetadata,
  SKILL_GROUP_CODE_PREFIX,
  type SkillPackageEntity,
  type SkillPackageSavePayload,
  type SkillSourceMetadata,
} from '@loncra/client/ai'
import {defineFormPage} from '@loncra/antdv-pro'
import type {IconfontJson} from '@/types/composables'
import {loadIcon, renderIconFont} from '@/utils'
import {ICON_SELECT_MODE} from '@loncra/antdv'
import {skillPackageCore} from './skill-package.page'

const iconOptions = ref<IconfontJson[]>([])
const ICON_FONTS = ['/font_ai_icon/iconfont.json']

function createEmptyEntity(): SkillPackageSavePayload {
  return {
    id: undefined as unknown as number,
    version: undefined as unknown as number,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    category: undefined as unknown as DataDictionaryMetadata,
    additionalInformation: '',
    origin: undefined as unknown as number,
    status: undefined as unknown as number,
    type: undefined as unknown as number,
    icon: '',
    defaultUpdatePolicy: undefined as unknown as number,
    sourceType: undefined as unknown as number,
    metadata: {
      source: {type: AI_SERVER_SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata,
    },
  }
}

function onDefaultUpdatePolicyChange(entity: SkillPackageSavePayload, value: number): void {
  if (value !== AI_SERVER_SKILL_UPDATE_POLICY.AUTOMATIC) {
    return
  }
  const metadata = entity.metadata as {updatePolicyTime?: {value: number; unit: string}}
  if (!metadata.updatePolicyTime) {
    metadata.updatePolicyTime = {value: 1, unit: TIME_UNIT_TYPE.DAYS}
  }
}

function onSourceTypeChange(entity: SkillPackageSavePayload, value: number): void {
  const metadata = entity.metadata as {source: SkillSourceMetadata}
  metadata.source = {type: value} as SkillSourceMetadata
  if (value === AI_SERVER_SKILL_SOURCE_TYPE.MANUAL) {
    entity.defaultUpdatePolicy = AI_SERVER_SKILL_UPDATE_POLICY.MANUAL
    metadata.source = {
      type: AI_SERVER_SKILL_SOURCE_TYPE.MANUAL,
    } as ManualSkillSourceMetadata
  } else {
    metadata.source = {type: AI_SERVER_SKILL_SOURCE_TYPE.GIT, url: ''} as GitSkillSourceMetadata
  }
}

export const skillPackageFormPage = defineFormPage(skillPackageCore, {
  createEntity: createEmptyEntity,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'packageKey',
      component: 'input',
      rules: [{required: true}],
      props: (ctx) => ({disabled: ctx.entity.id !== undefined}),
    },
    {
      key: 'icon',
      component: 'iconSelect',
      props: () => ({
        class: 'w-full',
        mode: ICON_SELECT_MODE.AVATAR,
        iconRender: (type: string) => renderIconFont(type),
        options: iconOptions.value,
      }),
    },
    {
      key: 'category',
      rules: [{required: true}],
      render: (ctx) =>
        h(Select, {
          class: 'w-full',
          value: ctx.entity.category?.code,
          options: (ctx.dictionaries[SKILL_GROUP_CODE_PREFIX] ?? []).map((item) => ({
            label: item.name,
            value: item.code,
            data: item,
          })),
          allowClear: true,
          onChange: (_value: unknown, option: unknown) => {
            const picked = (option as {data?: DataDictionaryMetadata} | undefined)?.data
            if (picked) {
              ctx.entity.category = picked
            }
          },
        }),
    },
    {key: 'origin', component: 'select', rules: [{required: true}]},
    {key: 'type', component: 'select', rules: [{required: true}]},
    {
      key: 'defaultUpdatePolicy',
      rules: [{required: true}],
      render: (ctx) => {
        const entity = ctx.entity
        const time = (
          entity.metadata as {updatePolicyTime?: {value: number; unit: string}}
        ).updatePolicyTime
        const children: unknown[] = [
          h(Select, {
            class: 'w-full',
            disabled:
              getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.MANUAL,
            value: entity.defaultUpdatePolicy,
            options: (ctx.buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
              SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM
            ] ?? []) as NameValueEnumMetadata<number>[],
            fieldNames: {label: 'name'},
            onChange: (value: unknown) =>
              onDefaultUpdatePolicyChange(entity, value as number),
            'onUpdate:value': (value: unknown) => {
              entity.defaultUpdatePolicy = value as number
            },
          }),
        ]
        if (time && getEnumValue(entity.defaultUpdatePolicy) === AI_SERVER_SKILL_UPDATE_POLICY.AUTOMATIC) {
          children.push(
            h(SpaceAddon, null, {
              default: () => ctx.t('aiServer.skillPackage.automaticUpdateInterval'),
            }),
            h(InputNumber, {
              class: 'w-60',
              min: 1,
              value: time.value,
              'onUpdate:value': (value: number) => {
                time.value = value
              },
            }),
            h(Select, {
              class: 'w-auto',
              options: (ctx.buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
                SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM
              ] ?? []) as NameValueEnumMetadata<string>[],
              fieldNames: {label: 'name'},
              value: time.unit,
              'onUpdate:value': (value: unknown) => {
                time.unit = value as string
              },
            }),
          )
        }
        return h(SpaceCompact, {block: true}, {default: () => children})
      },
    },
    {
      key: 'sourceType',
      component: 'select',
      rules: [{required: true}],
      props: (ctx) => ({
        onChange: (value: number) => onSourceTypeChange(ctx.entity, value),
      }),
    },
  ],
  enums: [{module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM]}],
  preMounted: async () => {
    iconOptions.value = []
    for (const font of ICON_FONTS) {
      iconOptions.value.push(await loadIcon(import.meta.env.VITE_APP_SITE_URL + font))
    }
  },
  postSubmit: async (result, ctx) => {
    const entity = ctx.entity.value
    const id = (result as RestResult<SkillPackageEntity['id']> | undefined)?.data
    if (id !== undefined) {
      entity.id = id
    }
    await nextTick()
    if (getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.MANUAL) {
      const upload = ctx.extra.uploadAttachments as (() => Promise<void> | undefined) | undefined
      await upload?.()
    }
    return false
  },
})
