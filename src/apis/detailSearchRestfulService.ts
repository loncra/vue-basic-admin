import type {BasicIdMetadata, DetailSearchService, RestResult,} from '@/types'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import axios from '@/requests'


export class DetailSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>  implements DetailSearchService<TEntity>
{

  constructor(
    protected readonly baseUrl: string,
  ) {
  }

  get(id: TId): Promise<RestResult<TEntity>> {
    return axios.get(this.baseUrl + "/" + id)
  }
}
