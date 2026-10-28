import {computed, ref, type Ref} from 'vue'
import {defineStore} from 'pinia'
import type {
  AuthCredentials,
  AuthenticationInfo,
  AuthenticationType,
  PersonalEnterprise,
  PrepareData
} from '@loncra/client/auth'
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AuthServerService,
  EnterpriseService
} from '@loncra/client/auth'
import type {UserPluginInstallResult} from '@loncra/client/ai'
import {AiUserPluginInstallService} from '@loncra/client/ai'
import type {RestResult} from '@loncra/client/commons'
import {getEnumValue} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {isBusinessSuccess} from '@/requests'
import {STORE} from '@/constants'
import {clearPrincipalDrafts} from '@loncra/chat-core/dexie'

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
      tenantId:'',
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
  type: AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
  rememberMe: false,
  grantedAuthorities: [],
  enterpriseDataSource:[]
}

export const usePrincipalStore = defineStore(STORE.PRINCIPAL_ID, () => {
  const state: Ref<AuthenticationInfo> = ref(RESET)
  const pluginInstalls = ref<UserPluginInstallResult[]>([])
  const pluginServices = ref<string[]>([])

  function hasPermission(permission: string): boolean {
    return state.value.grantedAuthorities.includes(permission)
  }

  function hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => hasPermission(permission))
  }

  function hasRole(role: string): boolean {
    const roles = state.value.grantedAuthorities
      .filter((item) => item.startsWith('ROLE_'))
      .map((item) => item.replace('ROLE_', ''))
    return roles.includes(role)
  }

  function hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => hasRole(role))
  }

  function getName(): string {
    return AuthServerService.getPrincipalNameByUserDetails(state.value.details?.metadata)
  }

  function getRoleName(): string {
    return (state.value.details?.metadata.role || []).map((r) => r.name).join(', ')
  }

  async function login(
    credentials: AuthCredentials,
    authenticationType: AuthenticationType = AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
  ): Promise<AuthenticationInfo> {
    const result:RestResult<AuthenticationInfo> = await AuthServerService.login(credentials, authenticationType)

    if (!isBusinessSuccess(result) || result.data === undefined) {
      throw new Error(result.message || '获取登录响应数据失败')
    }

    setState(result.data)
    return state.value
  }

  async function logout(): Promise<AuthenticationInfo> {
    await AuthServerService.logout()
    localStorage.removeItem(import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME)
    await $reset()
    return state.value
  }

  function setAvatar(object:ObjectWriteResult | null) {
    if (object === null) {
      delete state.value.details.metadata.avatar
    } else{
      state.value.details.metadata.avatar = object
    }
  }

  function isCurrentPrincipal(principal:string): boolean {
    return state.value.name === principal
  }

  async function switchWorkspace(enterpriseId:number | undefined) {
    try {
      state.value.switchingWorkspace = true
      const enterpriseService = new EnterpriseService()
      const result = await enterpriseService.switch(enterpriseId);
      if (result.data) {
        const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
        localStorage.setItem(accessTokenStorageName, result.data)
      }
      location.href = '/'
    } finally {
      state.value.switchingWorkspace = false
    }
  }

  async function prepare(): Promise<PrepareData> {
    const result:RestResult<PrepareData> = await AuthServerService.prepare()

    if (!isBusinessSuccess(result) || result.data === undefined) {
      throw new Error(result.message || '准备数据失败')
    }

    const data = result.data
    pluginServices.value = data.pluginServices ?? []

    const deviceIdName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
    let deviceIdentified: string | null = localStorage.getItem(deviceIdName)
    if (!deviceIdentified) {
      deviceIdentified = data.deviceIdentified
    }
    localStorage.setItem(deviceIdName, deviceIdentified)

    if (data.type !== AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE && result.data.authenticated) {
      const enterpriseService = new EnterpriseService()
      const enterpriseDataSource:RestResult<PersonalEnterprise[]> = await enterpriseService.my()
      data.enterpriseDataSource = enterpriseDataSource.data || []
    }

    setState(data)

    return data
  }

  function setState(data: Partial<AuthenticationInfo>): void {
    if (!data) {
      return
    }
    state.value = {...state.value, ...data}
    const accessTokenName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    let accessToken: string | null = localStorage.getItem(accessTokenName)
    const tokenValue = state.value.details?.token?.value
    if (tokenValue) {
      accessToken = tokenValue
    }
    localStorage.setItem(accessTokenName, accessToken ?? '')
  }

  async function $reset(): Promise<void> {
    const principal = state.value.name
    state.value = {...RESET}
    pluginInstalls.value = []
    pluginServices.value = []
    if (!principal) {
      return
    }
    try {
      await clearPrincipalDrafts(principal)
    } catch {
    }
  }

  async function loadPluginInstalls(): Promise<void> {
    const result: RestResult<UserPluginInstallResult[]> = await AiUserPluginInstallService.my()
    pluginInstalls.value = result.data || []
  }

  function upsertPluginInstall(result: UserPluginInstallResult): void {
    if (result.packageId == null) {
      return
    }
    const targetType = getEnumValue(result.targetType)
    const index = pluginInstalls.value.findIndex(
      (item) =>
        getEnumValue(item.targetType) === targetType && item.packageId === result.packageId,
    )
    if (index >= 0) {
      pluginInstalls.value.splice(index, 1, result)
      return
    }
    pluginInstalls.value = [result, ...pluginInstalls.value]
  }

  function removePluginInstall(id: number): void {
    pluginInstalls.value = pluginInstalls.value.filter((item) => item.id !== id)
  }

  const isAuthenticated = computed(() => state.value.authenticated)

  const isFullyAuthenticated = computed(() => state.value.authenticated && !state.value.rememberMe)

  return {
    state,
    pluginInstalls,
    pluginServices,
    loadPluginInstalls,
    upsertPluginInstall,
    removePluginInstall,
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    isCurrentPrincipal,
    isAuthenticated,
    isFullyAuthenticated,
    getName,
    getRoleName,
    setAvatar,
    login,
    logout,
    prepare,
    switchWorkspace,
    $reset,
    setState,
  }
})
