import axios, {type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios'
import router, {saveRequestPathThenToAuth} from '@/routers'
import {message} from 'antdv-next'
import {HTTP} from '@/constants'
import {AUTH_SERVER_AUTHENTICATION_TYPE_PARAM} from '@loncra/client/auth'
import {
  BusinessError,
  isBusinessSuccess,
  isResultSuccess,
  type RestResult
} from '@loncra/client/commons'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useBootstrapStore} from "@/stores/bootStore.ts";
import i18n from '@/i18n'

const ignoreErrorStatus: number[] = [404]

const checkDataValues: string[] = ['true', '1']

export {isBusinessSuccess, isResultSuccess} from '@loncra/client/commons'

export function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const dataVersionName = import.meta.env.VITE_APP_HEADER_DATA_VERSION_NAME
  const dataVersionValue = import.meta.env.VITE_APP_HEADER_DATA_VERSION_VALUE
  const deviceIdStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
  const deviceIdHeaderName = import.meta.env.VITE_APP_HEADER_DEVICE_IDENTIFIED_HEADER_NAME
  const accessTokenHeaderName = import.meta.env.VITE_APP_HEADER_ACCESS_TOKEN_HEADER_NAME
  const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME

  if (dataVersionName && dataVersionValue) {
    headers[dataVersionName] = dataVersionValue
  }
  const deviceId = localStorage.getItem(deviceIdStorageName)
  if (deviceId && deviceIdHeaderName) {
    headers[deviceIdHeaderName] = deviceId
  }
  const accessToken = localStorage.getItem(accessTokenStorageName)
  if (accessToken && accessTokenHeaderName) {
    headers[accessTokenHeaderName] = accessToken
  }
  return headers
}

function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const headers = buildAuthHeaders()
  Object.entries(headers).forEach(([key, value]) => {
    config.headers[key] = value
  })
  return config
}

function responseInterceptor<T = unknown>(
  response: AxiosResponse<RestResult<T>>,
): RestResult<T> | Promise<RestResult<T>> {
  const result = response.data

  if (!isBusinessSuccess(result)) {
    const errorMsg = `[executeCode:${result.executeCode}] ${result.message || i18n.global.t('error.http.requestFailed')}`

    if (!ignoreErrorStatus.includes(response.status)) {
      message.error(errorMsg).then(() => ({}))
    }

    return Promise.reject(
      new BusinessError(result.executeCode, result.status, result.message, result.data),
    )
  }
  const checkData =
    response.config.headers[import.meta.env.VITE_APP_HEADER_CHECK_SERVER_RESPONSE_DATA_NAME]
  if (checkData && checkDataValues.includes(checkData) && !isResultSuccess(result)) {
    return Promise.reject(
      new BusinessError(result.executeCode, result.status, i18n.global.t('error.http.noResponseData')),
    )
  }

  return result
}

async function responseError<T = unknown>(
  error: AxiosError<RestResult<T>>,
): Promise<AxiosError | Error | BusinessError | RestResult<T>> {
  if (error.response && ignoreErrorStatus.includes(error.response.status)) {
    return Promise.resolve(error.response.data)
  }

  if (!error.response) {
    const errorMsg = i18n.global.t('error.http.networkError')
    message.error(errorMsg)
    return Promise.reject(new Error(errorMsg))
  }

  const response = error.response
  const status = response.status
  const result = response.data

  let serverMessage: string | undefined = result?.message

  if (!serverMessage) {
    const statusStr = status.toString()
    serverMessage = HTTP.ERROR_MESSAGES[statusStr] || i18n.global.t('error.http.requestFailedWithStatus', {status})
  }

  if (status === 401) {
    const principalStore = usePrincipalStore()
    message.error(i18n.global.t('error.http.loginExpired'))
    if (!useBootstrapStore().running) {
      const params = new URLSearchParams(location.search)
      const authenticationType = String(params.get(AUTH_SERVER_AUTHENTICATION_TYPE_PARAM) || principalStore.state.type);
      const pushValue = saveRequestPathThenToAuth(location.pathname, authenticationType)
      router.push(pushValue)
    }
    return Promise.reject(
      new BusinessError(result?.executeCode || '401', status, serverMessage, result?.data),
    )
  }

  const statusStr = status.toString()
  const errorRoute = router.getRoutes().find((r) => r.name === statusStr)
  if (errorRoute) {
    sessionStorage.setItem(statusStr, JSON.stringify(result?.data || []))
    router.push({name: statusStr}).catch(() => {})
    return Promise.reject(
      new BusinessError(result?.executeCode || statusStr, status, serverMessage, result?.data),
    )
  }

  let errorCodePrefix
  if (result?.executeCode) {
    errorCodePrefix = `[executeCode:${result.executeCode}] `
  } else {
    errorCodePrefix = `[HTTP ${status}] `
  }

  if (!ignoreErrorStatus.includes(status)) {
    message.error(errorCodePrefix + serverMessage)
  }

  return Promise.reject(
    new BusinessError(result?.executeCode || statusStr, status, serverMessage, result?.data),
  )
}

axios.interceptors.request.use(requestInterceptor)

axios.interceptors.response.use(responseInterceptor as never, responseError)

export default axios
