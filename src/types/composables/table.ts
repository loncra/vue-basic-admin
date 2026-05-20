import type {BasicAuthorityProps} from './common'
import type {DropPosition, UseDragOptions} from './drag'
import {type Component, type ComputedRef, type Ref,} from "vue";
import {type MenuProps, type TableProps} from "antdv-next";
import type {
  BasicCrudService,
  BasicIdMetadata,
  FindSearchService,
  FlatSortMetadata,
  PageSearchService,
  ScrollPageResult,
  TreeSortMetadata
} from "@/types/apis";
import type {ColumnType} from "antdv-next/dist/table/interface";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";

/**
 * 表格行级权限
 */
export interface TableAuthorityProps extends BasicAuthorityProps {
  edit?:string | boolean
  export?:string | boolean
  add?:string | boolean
}

export interface ColumnSearchConfig {
  component?: Component
  props?: Record<string, unknown>
  expression?: string,
  queryName?: string,
  defaultValue?: unknown
}

export type SearchableColumnType<RecordType = Record<string, unknown>> = ColumnType<RecordType> & {
  search?: ColumnSearchConfig
}

export interface QueryTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: FindSearchService<TEntity, TId> | PageSearchService<TEntity, TPage, TId> | BasicCrudService<TBody, TEntity, TId>
  immediate?: boolean
  bordered?: boolean
  drag?: boolean
  authority?: TableAuthorityProps
  hideTitle?: boolean
  onRow?: TableProps['onRow']
  columns:SearchableColumnType[]
  enabledTitleActions?:boolean
  titleButtons?: NonNullable<MenuProps['items']>
  pagination?:TableProps['pagination']
  formatDragPreview?: (record: TEntity) => string
}

export interface CurdTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryTableProps<TBody, TEntity, TPage>{
  enabledRecordActions?: boolean
  actionButtons?: NonNullable<MenuProps['items']>
  renderActionItems?: (record: TEntity, actionItems: NonNullable<MenuProps['items']>) => NonNullable<MenuProps['items']>
}

export interface UseTableRowDragOptions<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
> extends UseDragOptions<TEntity> {
  dataSource: Ref<TEntity[]>
  onRow?: Ref<TableProps['onRow'] | undefined>
  onFlatDrop?: (payload: {
    sorts: FlatSortMetadata<TId>[]
    target: TEntity
    fromIndex: number
    toIndex: number
  }) => void
  onTreeDrop?: (payload: {
    sorts: TreeSortMetadata<TId>[]
    drag: TEntity
    target: TEntity
    dropPosition: DropPosition
    tree: TEntity[]
  }) => void
}

export interface UseTableRowDragReturn<TEntity> {
  tableOnRow: ComputedRef<TableProps['onRow'] | undefined>
  applyDragColumn: (columns: SearchableColumnType[]) => SearchableColumnType[]
  isDragCell: (column: { key?: string | number }) => boolean
  onDragHandleStart: (record: TEntity, event: DragEvent) => void
  onDragHandleEnd: () => void
  syncPlacementBaseline: (tree?: TEntity[]) => void
}
