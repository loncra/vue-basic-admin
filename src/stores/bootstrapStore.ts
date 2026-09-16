import {computed, ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants'
import {usePrincipalStore} from '@/stores/principalStore'
import {useMenuPrincipalStore} from '@/stores/menuStore'
import {
  applyMenusToRoutes,
  clearDynamicRoutes,
  getAuthRouterParam,
  registerServiceRoutes,
} from '@/routers'
import router from '@/routers'

export type BootStep = 'idle' | 'prepare' | 'routes' | 'menus' | 'ready' | 'error'

/**
 * 启动管线：prepare（拿已启动的服务） → 按服务装配路由 → 已认证才拉菜单。
 *
 * 由 App.vue 的 onMounted 触发；路由守卫通过 waitReady() 等它结束，
 * 401 拦截器通过 running 判断启动期不抢跳登录。
 */
export const useBootstrapStore = defineStore(STORE.BOOTSTRAP_ID, () => {
  const step = ref<BootStep>('idle')
  const error = ref<string | null>(null)
  /** 路由与菜单是否装配完成 */
  const ready = ref<boolean>(false)
  /** 启动管线是否正在执行 */
  const running = ref<boolean>(false)

  const loading = computed(() => !ready.value && step.value !== 'error')
  const failed = computed(() => step.value === 'error')

  // 就绪闸门：Promise 不适合放进响应式 state，作为闭包变量持有
  let pending: Promise<boolean> | undefined
  let readyPromise: Promise<void> | null = null
  let resolveReady: (() => void) | undefined

  /**
   * 路由守卫调用：路由表装配期间必须等，否则会拿着旧的（空的）匹配结果继续导航。
   * 可重置：登录 / 登出 / 切企业重建路由表期间同样会拦住导航。
   */
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

  /** 重建路由表前调用：把闸门重新关上，重建期间的导航会被拦住 */
  function closeGate(): void {
    ready.value = false
    resolveReady = undefined
    readyPromise = null
  }

  async function execute(): Promise<boolean> {
    error.value = null
    running.value = true
    try {
      const principalStore = usePrincipalStore()

      step.value = 'prepare'
      await principalStore.prepare()

      step.value = 'routes'
      const importRoutes = await registerServiceRoutes(principalStore.pluginServices)

      if (principalStore.isAuthenticated) {
        step.value = 'menus'
        await applyMenusToRoutes(importRoutes)
      }

      const menuPrincipalStore = useMenuPrincipalStore()
      menuPrincipalStore.refreshQuickAccess()

      step.value = 'ready'
      markDone()
      return true
    } catch (e) {
      const status = (e as {status?: number})?.status
      // 未认证（令牌过期等）：直接引导到登录页，而不是把用户卡在错误页
      if (status === 401) {
        markDone()
        await router.replace(getAuthRouterParam())
        return false
      }
      error.value = e instanceof Error ? e.message : String(e)
      step.value = 'error'
      markDone() // 失败也要开门，否则守卫会一直挂起
      return false
    }
  }

  /** 首次启动；重复调用复用同一个 Promise */
  function run(): Promise<boolean> {
    if (!pending) {
      pending = execute()
    }
    return pending
  }

  /** 加载页上的「重试」 */
  function retry(): Promise<boolean> {
    pending = execute()
    return pending
  }

  /** 登录 / 登出 / 切换企业后重建路由表 */
  async function rebuild(): Promise<boolean> {
    pending = undefined
    closeGate()
    clearDynamicRoutes()
    useMenuPrincipalStore().reset()
    return run()
  }

  return {step, error, ready, running, loading, failed, waitReady, closeGate, run, retry, rebuild}
})
