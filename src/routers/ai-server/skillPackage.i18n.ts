import type {RouteTitleMap} from '@/types/composables/common'

export default {
  ai_server_skill_package_edit: () =>
    ['common.edit', {name: 'aiServer.skillPackage.routePage'}] as const,
  ai_server_skill_package_add: () =>
    ['common.add', {name: 'aiServer.skillPackage.routePage'}] as const,
  ai_server_skill_package_detail: () =>
    ['common.detail', {name: 'aiServer.skillPackage.routePage'}] as const,
} satisfies RouteTitleMap
