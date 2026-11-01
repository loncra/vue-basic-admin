import type {RouteTitleMap} from '@/stores/menuStore'

export default {
  resource_server_carousel_edit: () =>
    ['common.edit', {name: 'resourceServer.carousel.routePage'}] as const,
  resource_server_carousel_add: () =>
    ['common.add', {name: 'resourceServer.carousel.routePage'}] as const,
} satisfies RouteTitleMap
