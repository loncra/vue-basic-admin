import type {ActionDefinition} from './actionButton'
import type {BasicAuthorityProps} from './common'
import type {
  BasicCrudService,
  BasicIdMetadata,
  FindSearchService,
  PageSearchService,
  ScrollPageResult,
} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'

/**
 * 列表/集合 CRUD 权限（QueryTable、QueryCardGrid 等共用）
 */
export interface AuthorityProps extends BasicAuthorityProps {
  edit?: string | boolean
  export?: string | boolean
  add?: string | boolean
}

export type CollectionService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> =
  | FindSearchService<TEntity, TId>
  | PageSearchService<TEntity, TPage, TId>
  | BasicCrudService<TBody, TEntity, TId>

export interface QueryCollectionProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  immediate?: boolean
  hideTitle?: boolean
  authority?: AuthorityProps
  actions?: ActionDefinition<TEntity>[]
  actionContextExtras?: Record<string, unknown>
  drag?: boolean
  formatDragPreview?: (record: TEntity) => string
}

export interface GridExposed<TEntity extends BasicIdMetadata<TId>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]> {
  fetchDataSource: () => Promise<void | undefined>
  exportData: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}