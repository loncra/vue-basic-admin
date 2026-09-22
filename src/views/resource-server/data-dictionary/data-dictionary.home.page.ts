import {defineHomePage} from '@loncra/antdv-pro'
import type {DataDictionaryEntity, DataDictionarySavePayload} from '@loncra/client/resource'
import {defineSearchProps} from '@/utils'
import {
  RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {dataDictionaryCore} from './data-dictionary.page'

/**
 * 没选字典类型时右表本来就是空的，新增 / 批量删除没有意义 ⇒
 * 按"查询里有没有 `type_id` 条件"决定显不显示（条件由 `Home.vue` 按外层传进来的 `typeId` 写）。
 */
function hasTypeFilter(ctx: {query?: unknown}): boolean {
  return Boolean((ctx.query as Record<string, unknown> | undefined)?.['filter_[type_id_eq]'])
}

/** 字典数据列表（`Home.vue`）。核心在 `data-dictionary.page.ts`，这里只写列表形态。 */
export const dataDictionaryHomePage = defineHomePage<DataDictionarySavePayload, DataDictionaryEntity>(
  dataDictionaryCore,
  {
    authority: {
      add: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.SAVE,
      edit: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.SAVE,
      delete: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.DELETE,
      detail: RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY.GET,
    },
    enums: [
      {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        ids: [SYSTEM_ENUM_TYPE.VALUE_TYPE_ENUM, SYSTEM_ENUM_TYPE.YES_OR_NO],
      },
    ],
    rowSelection: {fixed: true, type: 'checkbox'},
    /** 拖拽幽灵 = 名称（这一侧一直可拖，旧实现就没按权限关） */
    drag: (record) => record.name,
    columns: [
      {key: 'name', search: defineSearchProps('input')},
      {key: 'code', search: defineSearchProps('input')},
      {key: 'valueType', search: defineSearchProps('select')},
      {key: 'level', search: defineSearchProps('input')},
      {key: 'enabled', search: defineSearchProps('select')},
    ],
    /** 同 id 覆盖默认动作的 `visible`（`add` / `deleteSelected` 都只在有类型过滤时出现） */
    toolbarActions: [
      {id: 'add', visible: hasTypeFilter},
      {id: 'deleteSelected', visible: hasTypeFilter},
    ],
  },
)
