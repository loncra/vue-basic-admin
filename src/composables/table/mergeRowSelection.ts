import type {TableProps} from 'antdv-next'
import type {MaybeRef, Ref} from 'vue'
import {computed, unref} from 'vue'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

type RowSelection = NonNullable<TableProps['rowSelection']>

export function useMergeRowSelection<TEntity>(
  external: MaybeRef<RowSelection | false | null | undefined>,
  selectedRows: Ref<TEntity[]>,
  idKey: string = SYSTEM_CONSTANT.ID_NAME,
) {
  const onChange: NonNullable<RowSelection>['onChange'] = (keys, rows, info) => {
    selectedRows.value = rows as TEntity[]
    const ext = unref(external)
    if (ext && typeof ext === 'object') {
      ext.onChange?.(keys, rows, info)
    }
  }

  const rowSelection = computed((): RowSelection | undefined => {
    const ext = unref(external)
    if (!ext) {
      return undefined
    }
    const {onChange: _ignored, selectedRowKeys, ...rest} = ext
    return {
      ...rest,
      selectedRowKeys: selectedRowKeys ?? selectedRows.value.map(
        (row) => (row as Record<string, unknown>)[idKey] as string | number,
      ),
      onChange,
    }
  })

  return {rowSelection}
}
