import type {McpPackageEntity as ClientMcpPackageEntity} from '@loncra/client/ai'
import type {KeyValueRow} from '@/types/composables'

export interface McpPackageEntity extends ClientMcpPackageEntity {
  headerDataSource?: KeyValueRow[]
  queryParamDataSource?: KeyValueRow[]
  envDataSource?: KeyValueRow[]
}
