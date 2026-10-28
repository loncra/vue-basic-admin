import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants'
import i18n from '@/i18n'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import router, {
  applyMenusToRoutes,
  clearDynamicRoutes,
  getAuthRouterParam,
  registerServiceRoutes,
} from '@/routers'
import {useSocketStore} from "@/stores/socketStore.ts";

export type BootStep = 'idle' | 'prepare' | 'routes' | 'menus' | 'ready' | 'error'

export const useBootstrapStore = defineStore(STORE.BOOT_ID, () => {
  const step = ref<BootStep>('idle')
  const error = ref<string | null>(null)
  const ready = ref<boolean>(false)
  const running = ref<boolean>(false)

  const loading = computed(() => !ready.value && step.value !== 'error')
  const failed = computed(() => step.value === 'error')

  let pending: Promise<boolean> | undefined
  let readyPromise: Promise<void> | null = null
  let resolveReady: (() => void) | undefined

  function waitReady(): Promise<void> {
    if (ready.value) {
      return Promise.resolve()
    }
    readyPromise ??= new Promise<void>((resolve) => {
      resolveReady = resolve
    })
    return readyPromise
  }

  function markDone(): void {
    ready.value = true
    running.value = false
    resolveReady?.()
    resolveReady = undefined
    readyPromise = null
  }

  function closeGate(): void {
    ready.value = false
    resolveReady = undefined
    readyPromise = null
  }

  function setStatus(key: string): void {
    step.value = key as BootStep
    window.__boot?.setStatus(i18n.global.t(`boot.${key}`) as string)
  }

  async function execute(): Promise<boolean> {
    error.value = null
    running.value = true
    window.__boot?.reset()
    try {
      const principalStore = usePrincipalStore()

      setStatus('prepare')
      await principalStore.prepare()

      setStatus('routes')
      const importRoutes = await registerServiceRoutes(principalStore.pluginServices)

      if (principalStore.isAuthenticated) {
        setStatus('menus')
        await applyMenusToRoutes(importRoutes)
        setStatus('socketConnected')
        const socketStore = useSocketStore()
        socketStore.ensureConnected()
      }

      const menuPrincipalStore = useMenuPrincipalStore()
      menuPrincipalStore.refreshQuickAccess()

      setStatus('ready')
      markDone()
      return true
    } catch (e) {
      const status = (e as {status?: number})?.status
      if (status === 401) {
        markDone()
        await router.replace(getAuthRouterParam())
        return false
      }
      error.value = e instanceof Error ? e.message : String(e)
      step.value = 'error'
      window.__boot?.showError(error.value, i18n.global.t('common.retry.action') as string, () => {
        void retry()
      })
      markDone()
      return false
    }
  }

  function run(): Promise<boolean> {
    if (!pending) {
      pending = execute()
    }
    return pending
  }

  function retry(): Promise<boolean> {
    pending = execute()
    return pending
  }

  async function rebuild(): Promise<boolean> {
    pending = undefined
    closeGate()
    clearDynamicRoutes()
    useMenuPrincipalStore().reset()
    return run()
  }

  return {step, error, ready, running, loading, failed, waitReady, run, retry, rebuild}
})
