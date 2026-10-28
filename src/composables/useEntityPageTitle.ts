import {inject, onActivated, watch} from 'vue'
import {useRoute} from 'vue-router'
import i18n from '@/i18n'
import {LAYOUT_PANE_TITLE_PROVIDE_KEY} from '@/constants'
import {getRouteTitle} from '@/routers'
import {useMenuPrincipalStore} from '@/stores/menuStore'

export function useEntityPageTitle(suffix: () => string | undefined): void {
  const route = useRoute()
  const setPaneName = inject<(fullPath: string, name: string) => void>(LAYOUT_PANE_TITLE_PROVIDE_KEY)
  const menuPrincipalStore = useMenuPrincipalStore()

  const ownFullPath = route.fullPath
  const ownRouteName = route.name

  function isCurrent(): boolean {
    return route.fullPath === ownFullPath
  }

  function sync(): void {
    if (!isCurrent()) {
      return
    }
    const base = getRouteTitle(ownRouteName)
    const name = suffix()
    const title = name ? `${base} (${name})` : base
    setPaneName?.(ownFullPath, title)
    const breadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs]
    const last = breadcrumbs.at(-1)
    if (last) {
      last.name = title
      menuPrincipalStore.setCurrentBreadcrumbs(breadcrumbs)
    }
  }

  watch([() => i18n.global.locale.value, suffix], sync, {
    immediate: true,
    deep: true,
  })
  onActivated(sync)
}
