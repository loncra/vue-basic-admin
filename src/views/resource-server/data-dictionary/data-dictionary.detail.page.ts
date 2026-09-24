import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {defineDetailPage} from '@loncra/antdv-pro'
import {dataDictionaryCore} from './data-dictionary.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 字典数据详情（`Detail.vue`）。核心在 `data-dictionary.page.ts`，这里只写详情形态。
 *
 * 枚举值一律用 `format: 'enum'`（**不手写 `render`**）：`registry.ts` 的 `enum` formatter 就是
 * `getEnumName(value)` —— 值自带 `{name, value}` 出名称、裸 code 原样显示，与旧页面
 * `getEnumName(entity.xxx)` 完全等价。`valueType` / `enabled` 的 `format` 写在**核心字典**里
 * （与列表共用，只写一次），这里直接写裸 key。
 */
export const dataDictionaryDetailPage = defineDetailPage<
  DataDictionarySavePayload,
  DataDictionaryEntity
>(dataDictionaryCore, {
  column: COLUMN,
  // 顺序 = 旧页面的 descriptions 顺序
  fields: [
    'id',
    'name',
    'code',
    'valueType',
    'enabled',
    'level',
    'sort',
    // `value` 是字典项的值本身，核心字典里没写 format ⇒ 这里显式用 `enum`（= `getEnumName`，照旧）
    {key: 'value', span: 2, format: 'enum'},
    {key: 'remark', span: 2},
  ],
})
