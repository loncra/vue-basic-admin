import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import type {
  BasicIdMetadata,
  FilterRequest,
  PageRequest,
  RestResult,
  ScrollPageResult
} from '@/types/apis'
import type {CollectionService} from '@/types/composables/collection'

export async function exportCollectionData<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId,
>(options: {
  service: CollectionService<TBody, TEntity, TPage, TId>
  query: FilterRequest | PageRequest
  records: TEntity[]
}): Promise<RestResult<void>> {
  if (options.records.length > 0) {
    const filter: FilterRequest = {}
    filter[`filter_[${SYSTEM_CONSTANT.ID_NAME}_in]`] = options.records.map((r) => r.id)
    return options.service.exportData(filter)
  }
  return options.service.exportData(options.query)
}
