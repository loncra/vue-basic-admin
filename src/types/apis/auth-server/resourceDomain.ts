import type {RouteRecordName} from 'vue-router'
import type {RouteResourceMetadata as ClientRouteResourceMetadata} from '@loncra/client/auth'

export interface RouteResourceMetadata extends Omit<ClientRouteResourceMetadata, 'route'> {
  route: RouteRecordName
}
