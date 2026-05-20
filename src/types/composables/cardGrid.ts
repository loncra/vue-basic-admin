import type {ActionDefinition} from './actionButton'
import type {QueryCollectionProps} from './collection'
import type {PaginationProps} from 'antdv-next/dist/pagination'
import type {
  BasicIdMetadata,
  ScrollPageResult,
} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

export type CardGridPagination = false | PaginationProps

export interface QueryCardGridProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryCollectionProps<TBody, TEntity, TPage, TId> {
  pagination?: CardGridPagination
  dragDirection?: 'horizontal' | 'vertical'
  gridItemClass?: string
  selectable?: boolean
}

export interface CrudCardGridProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryCardGridProps<TBody, TEntity, TPage, TId> {
  recordActions?: boolean
  itemActions?: ActionDefinition<TEntity>[]
}
