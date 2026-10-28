import {inject} from 'vue'
import {type RouteLocationRaw, useRoute, useRouter} from 'vue-router'
import type {CrudStaleInfo} from '@loncra/antdv-pro'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY} from '@/constants'

export type PageExitRedirect = RouteLocationRaw | string | (() => RouteLocationRaw | string)

export function usePageExit(options: {
  redirect?: PageExitRedirect
}) {
  const router = useRouter()
  const route = useRoute()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  function backToList(): void {
    const {redirect} = options
    if (redirect) {
      const target = typeof redirect === 'function' ? redirect() : redirect
      router.push(typeof target === 'string' ? {name: target} : target)
    }
    closeLayoutTab?.(route.fullPath, false)
  }

  function onStale(info: CrudStaleInfo): void {
    if (info.reason === 'deleted') {
      backToList()
    }
  }

  return {backToList, onStale}
}
