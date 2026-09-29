import {h, nextTick, ref} from 'vue'
import {InputNumber, Select, SpaceAddon, SpaceCompact} from 'antdv-next'
import {IconSelect} from '@loncra/antdv'
import type {NameValueEnumMetadata, RestResult} from '@loncra/client/commons'
import {getEnumValue} from '@loncra/client/commons'
import type {DataDictionaryMetadata, EnumBucketsResponseBody} from '@loncra/client/resource'
import {
  AI_SERVER_SKILL_SOURCE_TYPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type GitSkillSourceMetadata,
  type ManualSkillSourceMetadata,
  type SkillPackageEntity,
  type SkillPackageSavePayload,
  type SkillSourceMetadata,
} from '@loncra/client/ai'
import {defineFormPage} from '@loncra/antdv-pro'
import {ResourceServerService} from '@/apis'
import type {IconfontJson} from '@/types/composables'
import {loadIcon, renderIconFont} from '@/utils'
import {
  ICON_SELECT_MODE,
  SKILL_GROUP_CODE_PREFIX,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
} from '@/constants'
import {skillPackageCore} from './skill-package.page'

/**
 * 这个表单要的三份"选项数据"（旧页面 `options` 里的 `groupOptions` / `timeOptions` / `iconOptions`）。
 *
 * 放模块级：消费方全在本文件（下面三个 `render`），没必要绕 `ctx.extra` 从壳里递进来。
 * `origin` / `type` / `sourceType` / `defaultUpdatePolicy` 那几份枚举**不在这里** —— 它们写在核心字典
 * 的 `enumRef` 上，pro 的 `collectFormSources` 会自动拉桶（旧页面 `preMounted` 里那半段因此删掉）。
 */
const groupOptions = ref<DataDictionaryMetadata[]>([])
const timeOptions = ref<NameValueEnumMetadata<string>[]>([])
/**
 * 更新策略的选项：`defaultUpdatePolicy` 是 `render` 字段 ⇒ 拿不到 pro 给组件注入的 options
 * （`render` 逃生时 `component` 是空的），所以这一份得自己拉。
 */
const updatePolicyOptions = ref<NameValueEnumMetadata<number>[]>([])
const iconOptions = ref<IconfontJson[]>([])
/** 图标字体清单（旧页面的 `options.icons`） */
const ICON_FONTS = ['/font_ai_icon/iconfont.json']

/** 实体初值（照抄旧页面的 `createEmptyEntity`） */
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

/** 默认更新策略切到「自动」时补一个默认间隔（旧页面 `onDefaultUpdatePolicyChange`） */
function onDefaultUpdatePolicyChange(entity: SkillPackageSavePayload, value: number): void {
  if (value !== AI_SERVER_SKILL_UPDATE_POLICY.AUTOMATIC) {
    return
  }
  const metadata = entity.metadata as {updatePolicyTime?: {value: number; unit: string}}
  if (!metadata.updatePolicyTime) {
    metadata.updatePolicyTime = {value: 1, unit: TIME_UNIT_TYPE.DAYS}
  }
}

/**
 * 来源类型切换（旧页面 `onSourceTypeChange`）：整体换掉 `metadata.source`，
 * 手工来源顺带把更新策略压回「手动」。
 */
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

/**
 * 技能包新增/编辑（`Form.vue`）。核心在 `skill-package.page.ts`，这里只写表单形态。
 *
 * **声明与壳的分工**（按旧页面的视觉顺序定的）：
 * - 上面那 8 个字段在 `<Row>` 里（默认 `col` = 一行两个，与旧页面的 `md:12` 一致）；
 * - **其余五块留在壳的 `#default` 插槽**（旧页面它们就在 `#rowLayout` 之外）：Git 来源（带
 *   `['metadata','source','url']` 嵌套校验）、标签、文件（`AttachmentUpload` / `FileEditor`）、简介、附加信息
 *   —— 这样**顺序与旧页面完全一致**，且带宿主组件的块不必塞进声明；
 * - 枚举字段（`origin` / `type` / `sourceType` / `defaultUpdatePolicy`）**不手写 options**：
 *   核心字典有 `enumRef` ⇒ pro 自动拉桶并映射成组件能吃的形状；
 * - `icon` / `category` / `defaultUpdatePolicy` 三处是**组合控件**（`IconSelect` / 取整条字典项的
 *   `Select` / 带「自动更新间隔」的 `SpaceCompact`）⇒ 用 `render` 自绘（表单字段 key 不支持 `a.b` 路径）。
 */
export const skillPackageFormPage = defineFormPage(skillPackageCore, {
  createEntity: createEmptyEntity,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'packageKey',
      component: 'input',
      rules: [{required: true}],
      /** 编辑态不让改（旧页面读 `$route.query.id`；pro 里读实体 —— 取数后 id 就有了，会跟着变） */
      props: (ctx) => ({disabled: ctx.entity.id !== undefined}),
    },
    {
      key: 'icon',
      render: (ctx) =>
        h(IconSelect, {
          class: 'w-full',
          mode: ICON_SELECT_MODE.AVATAR,
          // 宿主的 `renderIconFont(type, classes)` 第二参是类名 ⇒ 包一层把 `align` 带上
          // （`IconSelect` 的 `iconRender` 只收 `type` 一个参数）
          iconRender: (type: string) => renderIconFont(type, 'align'),
          value: ctx.entity.icon,
          options: iconOptions.value,
          'onUpdate:value': (value: string) => {
            ctx.entity.icon = value
          },
        }),
    },
    {
      key: 'category',
      rules: [{required: true}],
      /**
       * 值存**整条字典项**（旧页面的 `@change` 把 option 整个塞回实体）⇒ 用 render 才对得上。
       * options 手工摊成 `{label, value, data}`（字典项的 `value` 允许是 boolean，与 Select 的
       * `DefaultOptionType` 不兼容），`data` 里留着整条以便回写实体。
       */
      render: (ctx) =>
        h(Select, {
          class: 'w-full',
          value: ctx.entity.category?.code,
          options: groupOptions.value.map((item) => ({
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
            options: updatePolicyOptions.value,
            fieldNames: {label: 'name'},
            // Select 的回调参数是 `SelectValue`（可空）⇒ 收到后自己收窄
            onChange: (value: unknown) =>
              onDefaultUpdatePolicyChange(entity, value as number),
            'onUpdate:value': (value: unknown) => {
              entity.defaultUpdatePolicy = value as number
            },
          }),
        ]
        // 「自动更新间隔」只在「自动」且已经有间隔值时出现（旧页面那个 `<template v-if>`）
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
              options: timeOptions.value,
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
  /**
   * 旧页面 `preMounted` 的后半段：字典分组 + 时间单位 + 图标字体。
   * （前半段手拉的那四份枚举已由核心字典的 `enumRef` 接管 ✓）
   */
  preMounted: async () => {
    const enums: RestResult<EnumBucketsResponseBody> =
      await ResourceServerService.getServiceEnumerates({
        [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
          {id: SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM},
          {id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM},
        ],
      })
    const resourceServer = enums.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}
    timeOptions.value = (resourceServer[SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM] ??
      []) as NameValueEnumMetadata<string>[]
    updatePolicyOptions.value = (resourceServer[SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM] ??
      []) as NameValueEnumMetadata<number>[]

    const dictionaries: RestResult<Record<string, DataDictionaryMetadata[]>> =
      await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
    groupOptions.value = dictionaries.data?.[SKILL_GROUP_CODE_PREFIX] ?? []

    iconOptions.value = []
    for (const font of ICON_FONTS) {
      iconOptions.value.push(await loadIcon(import.meta.env.VITE_APP_SITE_URL + font))
    }
  },
  /**
   * 旧页面 `postSubmit`：把新建出来的 id 写回实体（文件那块要它才切到编辑器），
   * 手工来源再把选好的附件传上去；**返回 `false` = 不接管**，壳照常走成功流程。
   */
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
