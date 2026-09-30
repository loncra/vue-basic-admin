import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import {DictionaryTypeService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {OPERATION_DATA_TRACE_TABLE} from '@/constants'

/**
 * 字典类型的 service。`Home.vue` 里的新增/修改弹层（表单声明 `dictionary-type.form.page.ts`）
 * 也要用它保存 ⇒ 导出，别重复 `new`。
 */
export const dictionaryTypeService = new DictionaryTypeService()

/**
 * 字典类型（`Home.vue`）的**核心**：`service` / i18n / `fields` 只写一次。
 *
 * - 这一侧**不写 `routes`**：它没有自己的路由、也没有 Form / Detail 页，
 *   新增与修改都是 `Home.vue` 里的**弹层**（`CrudFormModal` + 表单声明）；
 * - `operationDataTraceTarget` 是给那个弹层表单用的（`CrudFormModal` 里由表单壳按它渲染操作轨迹）。
 */
export const dictionaryTypeCore: CrudPageCore<DictionaryTypeSavePayload, DictionaryTypeEntity> = {
  service: dictionaryTypeService,
  i18nPrefix: 'resourceServer.dictionaryType',
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.DICTIONARY_TYPE,
  fields: {
    name: {labelKey: 'common.name'},
    code: {labelKey: 'common.code'},
  },
}
