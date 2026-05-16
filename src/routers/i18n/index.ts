import i18n from '@/i18n'
import type {RouteLocationNormalized} from 'vue-router'

import type {RouteTitleGetter, RouteTitleMap, RouteTitleParams} from '@/types/common'

const titleModules = import.meta.glob<RouteTitleMap>('@/routers/**/*.titles.ts', {
  eager: true,
  import: 'default',
})

export const routeTitles: RouteTitleMap = Object.assign({}, ...Object.values(titleModules))

function resolveParamValue(value: string): string {
  return i18n.global.te(value) ? i18n.global.t(value) : value
}

function resolveParams(params?: RouteTitleParams): Record<string, string> | undefined {
  if (!params) {
    return undefined
  }
  const resolved: Record<string, string> = {}
  for (const [key, value] of Object.entries(params)) {
    resolved[key] = resolveParamValue(value)
  }
  return resolved
}

export function resolveRouteTitle(getter: RouteTitleGetter): string {
  const [key, params] = getter()
  const resolvedParams = resolveParams(params)
  if (resolvedParams) {
    return i18n.global.t(key, resolvedParams)
  }
  return i18n.global.t(key)
}

export function resolveRouteTitleByName(route: RouteLocationNormalized): string {
  const name = route.name
  if (typeof name === 'string' && name in routeTitles) {
    const getter = routeTitles[name]
    if (getter) {
      return resolveRouteTitle(getter)
    }
  }
  const metaTitle = route.meta?.title
  if (typeof metaTitle === 'string' && metaTitle !== '') {
    return metaTitle
  }
  return i18n.global.t('common.unname')
}
