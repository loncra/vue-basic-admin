import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import {defineFormPage, type PageFieldRenderContext} from '@loncra/antdv-pro'
import {dictionaryTypeCore} from './dictionary-type.page'

/** 弹层用的空实体（`id` 为假值 = 新增；编辑态只给 `id`，其余由壳按 id 拉） */
export function emptyDictionaryTypeEntity(): DictionaryTypeSavePayload {
  return {
    code: '',
    name: '',
    id: null as unknown as number,
    version: null as unknown as number,
  }
}

/**
 * 字典类型的**表单形态**（`Home.vue` 的新增 / 修改弹层）。核心在 `dictionary-type.page.ts`。
 *
 * ⚠️ 与其它页面的 `.form.page.ts` **是同一个形态**：弹层壳（`CrudFormModal`）吃的就是这份声明
 * （`defineFormPage` 的产物）⇒ 不需要"弹层专用"的写法。三处照旧：
 * - `name` / `code` 都必填（旧页 `a-form-item` 的 `:rules`）；
 * - 「加子级」时 `code` 前面显示父级 code 前缀（旧页那个 `#prefix` 插槽）⇒ 走**声明级插槽**：
 *   `PageFormField.slots` 的参数**末尾**带字段 ctx（实体 / `extra` / 来源 / `t`），前缀从
 *   `ctx.extra.parentCode` 取 —— 父级信息由壳经 `:context-extra` 递进来；
 * - `parentId` 的注入走 `preMounted`（`PageFormContext.entity` 是 **Ref**）：`createEntity()` 无参、
 *   拿不到"这一次弹层是为谁而开"，那是 pro 的既有口径（同 `role.form.page.ts` 的 `preMounted`）。
 */
export const dictionaryTypeFormPage = defineFormPage(dictionaryTypeCore, {
  createEntity: emptyDictionaryTypeEntity,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}],col: {span: 24}},
    {
      key: 'code',
      component: 'input',
      rules: [{required: true}],
      col: {span: 24},
      slots: {
        /** 加子级时在输入框里显示父级 code 前缀（`null` = 不显示）；`ctx` 是插槽末尾那个字段 ctx */
        prefix: (_value: unknown, ctx: PageFieldRenderContext<DictionaryTypeSavePayload>) =>
          ctx.extra.parentCode ? `${ctx.extra.parentCode}.` : null,
      },
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      labelKey:'common.remark',
      props: {rows: 3, showCount: true, maxlength: 256},
    },
  ],
  preMounted: (ctx) => {
    const parentId = ctx.extra.parentId
    if (typeof parentId === 'number') {
      ctx.entity.value.parentId = parentId
    }
  },
})
