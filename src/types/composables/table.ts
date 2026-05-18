import type {BasicAuthorityProps} from './common'
import {type Component, type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {App, type MenuProps, type TableProps} from "antdv-next";
import type {
  BasicCrudService,
  BasicIdMetadata,
  FindSearchService,
  PageSearchService,
  ScrollPageResult
} from "@/types/apis";
import type {ColumnType} from "antdv-next/dist/table/interface";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {requireNonNullOrUndefined} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";

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
  authority?: TableAuthorityProps
  hideTitle?: boolean
  columns:SearchableColumnType[]
  enabledTitleActions?:boolean
  titleButtons?: NonNullable<MenuProps['items']>
  pagination?:TableProps['pagination']
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
