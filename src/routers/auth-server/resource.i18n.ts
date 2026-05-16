import type {RouteTitleMap} from '@/types/common'

export default {
  auth_server_resource_addChild: () =>
    ['common.addChild', {name: 'authServer.resource.routePage'}] as const,
  auth_server_resource_edit: () =>
    ['common.edit', {name: 'authServer.resource.routePage'}] as const,
  auth_server_resource_add: () =>
    ['common.add', {name: 'authServer.resource.routePage'}] as const,
  auth_server_resource_detail: () =>
    ['common.detail', {name: 'authServer.resource.routePage'}] as const,
} satisfies RouteTitleMap
