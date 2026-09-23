import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {getEnumName} from '@loncra/client/commons'
import {defineDetailPage} from '@loncra/antdv-pro'
import {dataDictionaryCore} from './data-dictionary.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 字典数据详情（`Detail.vue`）。核心在 `data-dictionary.page.ts`，这里只写详情形态。
 *
 * 枚举值（`valueType` / `enabled` / `value`）**照旧走宿主 `getEnumName`**（用 `render` 逃生）：
 * 它们可能是**裸 code**，而 pro 的 `format: 'enum'` 只认值自带的 `{name, value}`（详情不拉桶查名）
 * ⇒ 只有 `render` 才能和旧页面显示得一字不差。
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
    {key: 'valueType', render: (value) => getEnumName(value as never)},
    {key: 'enabled', render: (value) => getEnumName(value as never)},
    'level',
    'sort',
    {key: 'value', span: 2, render: (value) => getEnumName(value as never)},
    {key: 'remark', span: 2},
  ],
})
