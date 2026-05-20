import type { Ref } from 'vue'
import type {PaginationProps} from 'antdv-next/dist/pagination'
import type {
  BasicIdMetadata,
  FilterRequest,
  FindSearchService,
  PageRequest,
  PageResult,
  PageSearchService,
  RestResult,
  ScrollPageResult,
  TotalPage,
} from '@/types/apis'
import type {CollectionService} from '@/types/composables/collection'
import type {PageSearchRestfulService} from '@/apis/pageSearchRestfulService.ts'

export type CollectionPagination = false | PaginationProps

export function syncPaginationFromPageResult<TEntity>(
  pagination: PaginationProps,
  pageData: PageResult<TEntity> & TotalPage<TEntity>,
  query: PageRequest,
  rowCount: number,
) {
  pagination.pageSize = pageData.size || 10
  if (pageData.number) {
    pagination.current = pageData.number
    const n =
      typeof pageData.number === 'number' && Number.isFinite(pageData.number)
        ? pageData.number
        : (query.number ?? 1)
    if (pageData.last) {
      pagination.total = (n - 1) * pageData.size + rowCount
    } else {
      pagination.total = n * pageData.size + 1
    }
  }
  if (pageData.totalCount) {
    pagination.total = pageData.totalCount
  }
}

export async function fetchCollectionData<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId,
>(options: {
  service: CollectionService<TBody, TEntity, TPage, TId>
  query: FilterRequest | PageRequest
  pagination: Ref<CollectionPagination | undefined>
}): Promise<TEntity[]> {
  const {service, query, pagination} = options
  const data: TEntity[] = []

  if (typeof (service as PageSearchService<TEntity, TPage, TId>).page === 'function') {
    const result: RestResult<TPage> = await (
      service as PageSearchRestfulService<TEntity, TPage, TId>
    ).page(query as PageRequest)
    data.push(...(result.data?.elements || []))
    if (pagination.value !== false && pagination.value != null) {
      syncPaginationFromPageResult(
        pagination.value,
        result.data as unknown as PageResult<TEntity> & TotalPage<TEntity>,
        query as PageRequest,
        data.length,
      )
    }
  } else if (typeof (service as FindSearchService<TEntity, TId>).find === 'function') {
    const result: RestResult<TEntity[]> = await (
      service as FindSearchService<TEntity, TId>
    ).find(query as FilterRequest)
    data.push(...(result.data || []))
    pagination.value = false
  }

  return data
}
