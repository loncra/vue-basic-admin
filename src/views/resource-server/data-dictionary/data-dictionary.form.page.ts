import {h, ref} from 'vue'
import {Input, TypographyText} from 'antdv-next'
import type {
  DataDictionaryEntity,
  DataDictionarySavePayload,
  DictionaryTypeEntity,
} from '@loncra/client/resource'
import {DictionaryTypeService} from '@loncra/client/resource'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {VALUE_TYPE} from '@/constants'
import {dataDictionaryCore} from './data-dictionary.page'

const typeService = new DictionaryTypeService()

/**
 * 「类型 / 父数据」这两个上下文对象：`preMounted` / `postGetEntity` 里填，
 * **页壳拿它拼标题**、`code` 的前缀也读它（声明要打开壳里的东西就导出模块级状态）。
 */
export const dictionaryFormContext = ref<{
  type?: DictionaryTypeEntity
  parent?: DataDictionaryEntity
}>({})

/** `code` 输入框的前缀：`类型码.` 或 `父数据码.`（旧页面 `#prefix` 插槽那一坨，没有就不显示） */
function codePrefix() {
  const prefix = dictionaryFormContext.value.type?.code ?? dictionaryFormContext.value.parent?.code
  return prefix ? h(TypographyText, {strong: true}, {default: () => `${prefix}.`}) : undefined
}

/**
 * 字典数据新增/编辑（`Form.vue`）。核心在 `data-dictionary.page.ts`，这里只写表单形态。
 *
 * 四处照旧：
 * - 三个 enum 下拉（`enabled` / `valueType`）的选项来自核心字典的 `enumRef`（不必手写取枚举那段）；
 * - `code` 要带 `类型码.` / `父数据码.` 前缀 —— 字段 DSL 不给插槽，用 `render`（它的产物落在
 *   `a-form-item` 里，正好可以给 `a-input` 传 `#prefix`）；
 * - 入口三选一：`parentId`（在某条数据下新增）→ 取父数据；`typeId`（在某类型下新增）→ 取类型并
 *   写进 `entity.typeId`；`id`（编辑）→ 取实体后在 `postGetEntity` 里按类型剥掉 `code` 前缀；
 * - 标题不在这里（`titleText` 没进 pro）⇒ 页壳用 `dictionaryFormContext` + 实体拼（旧 `setPageTitle`）。
 */
export const dataDictionaryFormPage = defineFormPage<
  DataDictionarySavePayload,
  DataDictionaryEntity
>(dataDictionaryCore, {
  createEntity: () => ({
    id: null as unknown as number,
    version: null as unknown as number,
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    enabled: 1,
    typeId: null as unknown as number,
    parentId: null as unknown as number,
  }),
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'code',
      rules: [{required: true}],
      render: (ctx) =>
        h(
          Input,
          {
            value: ctx.entity.code,
            'onUpdate:value': (value: string) => (ctx.entity.code = value),
          },
          {prefix: () => codePrefix()},
        ),
    },
    {key: 'enabled', component: 'select'},
    {key: 'valueType', component: 'select'},
    {key: 'level', component: 'input'},
    {key: 'sort', component: 'number', props: {class: 'w-full'}},
    {
      key: 'value',
      component: 'textarea',
      span: 24,
      rules: [{required: true}],
      props: {rows: 4, showCount: true, maxlength: 256},
    },
    {
      key: 'remark',
      component: 'textarea',
      span: 24,
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  // `preMounted` 用不了 pro 的 contextExtra（那要页壳传）—— 声明文件自己 import 宿主 router
  preMounted: async (ctx) => {
    const {parentId, typeId} = router.currentRoute.value.query
    if (parentId) {
      const result = await dataDictionaryCore.service.get(parentId as never)
      if (result.data) {
        dictionaryFormContext.value = {...dictionaryFormContext.value, parent: result.data}
      }
      return
    }
    if (!typeId) {
      return
    }
    const result = await typeService.get(typeId as never)
    const type = result.data
    if (!type) {
      return
    }
    dictionaryFormContext.value = {...dictionaryFormContext.value, type}
    const entity = ctx.entity?.value
    if (entity) {
      entity.typeId = Number(type.id)
    }
  },
  /** 编辑态：拿到类型（拼标题 + 当前缀），并把已经存进去的 `类型码.` 前缀从 `code` 里剥掉 */
  postGetEntity: async (entity) => {
    if (entity.typeId == null) {
      return entity
    }
    const result = await typeService.get(entity.typeId as never)
    const type = result.data
    if (!type) {
      return entity
    }
    dictionaryFormContext.value = {...dictionaryFormContext.value, type}
    entity.code = (entity.code ?? '').replace(type.code + '.', '')
    return entity
  },
})
