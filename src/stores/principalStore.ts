import {computed, ref, type Ref} from 'vue'
import {defineStore} from 'pinia'
import {AuthServerService} from '../apis/auth-server'
import {
  type AuthCredentials,
  type AuthenticationInfo,
  type AuthenticationType,
  type PrepareData
} from '../types/auth-server'
import {isResultSuccess} from '@/requests'
import {AUTHENTICATION_TYPE} from '@/constants/authConstant'
import {STORE} from '@/constants/systemConstant'

/**
 * 重置状态常量
 */
const RESET: AuthenticationInfo = {
  details: {
    metadata: {
      gender: {
        name: '未知性别',
        value: 30,
      },
      email: '',
      emailVerified: {
        name: '否',
        value: 0,
      },
      phoneNumber: '',
      phoneNumberVerified: {
        name: '否',
        value: 0,
      },
      realName: '未知',
    },
  },
  authenticated: false,
  principal: {
    id: '0',
    username: '未知用户',
  },
  name: '',
  shortName: '',
  type: 'CONSOLE',
  rememberMe: false,
  grantedAuthorities: [],
}

export const usePrincipalStore = defineStore(STORE.PRINCIPAL_ID, () => {
  const state: Ref<AuthenticationInfo> = ref(RESET)

  /**
   * 检查是否有指定权限
   */
  function hasPermission(permission: string): boolean {
    return state.value.grantedAuthorities.includes(permission)
  }

  /**
   * 检查是否有任意一个权限
   */
  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => hasPermission(permission))
  }

  /**
   * 检查是否有指定角色
   */
  function hasRole(role: string): boolean {
    const roles = state.value.grantedAuthorities
      .filter((item) => item.startsWith('ROLE_'))
      .map((item) => item.replace('ROLE_', ''))
    return roles.includes(role)
  }

  /**
   * 检查是否有任意一个角色
   */
  function hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => hasRole(role))
  }

  /**
   * 获取用户显示名称
   */
  function getName(): string {
    return state.value?.details?.metadata?.realName || state.value.name || '未知用户'
  }

  function getRoleName(): string {
    return (state.value.details?.metadata.role || []).map((r) => r.name).join(', ')
  }

  /**
   * 登录
   */
  async function login(
    credentials: AuthCredentials,
    authenticationType: AuthenticationType = AUTHENTICATION_TYPE.CONSOLE,
  ): Promise<AuthenticationInfo> {
    const result = await AuthServerService.login(credentials, authenticationType)

    // 使用统一的响应检查函数
    if (!isResultSuccess(result)) {
      throw new Error(result?.message || '获取登录响应数据失败')
    }

    // 设置认证信息
    setState(result.data)
    return state.value
  }

  /**
   * 登出
   */
  async function logout(): Promise<AuthenticationInfo> {
    await AuthServerService.logout()
    $reset()
    return state.value
  }

  /**
   * 准备（初始化）应用数据
   */
  async function prepare(): Promise<PrepareData> {
    const result = await AuthServerService.prepare()

    // 使用统一的响应检查函数
    if (!isResultSuccess(result)) {
      throw new Error(result?.message || '准备数据失败')
    }

    const data = result.data

    // 保存设备标识
    const deviceIdName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
    let deviceIdentified: string | null = localStorage.getItem(deviceIdName)
    if (!deviceIdentified) {
      deviceIdentified = data.deviceIdentified
    }
    localStorage.setItem(deviceIdName, deviceIdentified)

    setState(data)

    return data
  }

  /**
   * 设置状态
   */
  function setState(data: Partial<AuthenticationInfo>): void {
    if (!data) {
      return
    }
    state.value = {...state.value, ...data}
    // 保存 accessToken
    const accessTokenName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    let accessToken: string | null = localStorage.getItem(accessTokenName)
    const tokenValue = state.value.details?.token?.value
    if (tokenValue) {
      accessToken = tokenValue
    }
    localStorage.setItem(accessTokenName, accessToken ?? '')
  }

  /**
   * 重置状态
   */
  function $reset(): void {
    state.value = {...RESET}
  }

  /**
   * 计算属性：是否已认证
   */
  const isAuthenticated = computed(() => state.value.authenticated)

  /**
   * 计算属性：是否完全认证（非记住我模式）
   */
  const isFullyAuthenticated = computed(() => state.value.authenticated && !state.value.rememberMe)

  return {
    // 状态
    state,
    // 权限检查
    hasPermission,
    hasAnyPermission,
    // 角色检查
    hasRole,
    hasAnyRole,
    // 认证状态
    isAuthenticated,
    isFullyAuthenticated,
    // 用户信息
    getName,
    getRoleName,
    // 操作方法
    login,
    logout,
    prepare,
    // 工具方法
    $reset,
    setState,
  }
})
