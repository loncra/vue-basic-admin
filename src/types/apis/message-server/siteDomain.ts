import type {PageRequest, TotalPage} from '@loncra/client/commons'
import type {SiteMessageEntity} from '@loncra/client/message'

export interface MySiteMessageProps {
  dataSource: TotalPage<SiteMessageEntity>
  key: string
  install: boolean
  loading: boolean
  pageRequest: PageRequest
}
