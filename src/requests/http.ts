import axios, {type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig} from 'axios'
import router from '@/routers'
import {message} from 'antdv-next'
import {HTTP} from '@/constants/systemConstant.ts'
import {BusinessError, type RestResult} from '@/types/apis'

/** 不弹出错误提示的 HTTP 状态码 */
const ignoreErrorStatus: number[] = [404]

/** 表示需要校验 data 的请求头合法值 */
const checkDataValues: string[] = ['true', '1']

/**
 * 检查业务是否成功
 * @param result 响应结果
 * @returns 是否为成功响应
 */
export function isBusinessSuccess<T>(result: RestResult<T>): boolean {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return result.status === 200 && HTTP.SUCCESS_EXECUTE_CODES.includes(result.executeCode)
}

/**
 * 检查 RestResult 是否成功且包含数据（包含空值检查）
 * @param result RestResult 对象
 * @returns 是否为成功响应且包含数据
 */
export function isResultSuccess<T>(
  result: RestResult<T> | null | undefined,
): result is RestResult<T> & { data: T } {
  if (!result) {
    return false
  }
  return isBusinessSuccess(result) && result.data !== undefined
}

/**
 * HTTP 请求拦截器
 * 在发送请求前，自动添加必要的请求头信息
 * 包括数据版本号和设备标识等
 *
 * @param config - Axios 请求配置对象
 * @returns 添加了请求头后的配置对象
 */
function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  // 获取环境变量中的配置项名称
  const dataVersionName = import.meta.env.VITE_APP_HEADER_DATA_VERSION_NAME
  const dataVersionValue = import.meta.env.VITE_APP_HEADER_DATA_VERSION_VALUE
  const deviceIdStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_DEVICE_IDENTIFIED_NAME
  const deviceIdHeaderName = import.meta.env.VITE_APP_HEADER_DEVICE_IDENTIFIED_HEADER_NAME
  const accessTokenHeaderName = import.meta.env.VITE_APP_HEADER_ACCESS_TOKEN_HEADER_NAME
  const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME

  // 添加数据版本号请求头（用于 API 版本控制）
  config.headers[dataVersionName] = dataVersionValue

  // 从本地存储获取设备标识，如果存在则添加到请求头
  const deviceId = localStorage.getItem(deviceIdStorageName)
  if (deviceId) {
    config.headers[deviceIdHeaderName] = deviceId
  }

  const accessToken = localStorage.getItem(accessTokenStorageName)
  if (accessToken) {
    config.headers[accessTokenHeaderName] = accessToken
  }

  return config
}

/**
 * HTTP 响应拦截器
 * 统一处理业务状态码判断，验证请求是否成功
 * 如果失败则显示错误消息并抛出业务错误
 * 如果成功则直接返回 RestResult 数据，而不是整个 AxiosResponse
 *
 * @template T - 响应数据的类型
 * @param response - Axios 响应对象
 * @returns RestResult<T> 对象（成功时）或 Promise.reject（失败时）
 */
function responseInterceptor<T = unknown>(
  response: AxiosResponse<RestResult<T>>,
): RestResult<T> | Promise<RestResult<T>> {
  const result = response.data

  // 检查业务是否成功（检查 HTTP 状态码和业务状态码）
  if (!isBusinessSuccess(result)) {
    // 构造错误消息
    const errorMsg = `[executeCode:${result.executeCode}] ${result.message || '请求失败'}`

    // 如果错误状态码不在忽略列表中，显示错误消息提示用户
    if (!ignoreErrorStatus.includes(response.status)) {
      message.error(errorMsg).then(() => ({}))
    }

    // 抛出业务错误，包含完整的错误信息
    return Promise.reject(
      new BusinessError(result.executeCode, result.status, result.message, result.data),
    )
  }
  const checkData =
    response.config.headers[import.meta.env.VITE_APP_HEADER_CHECK_SERVER_RESPONSE_DATA_NAME]
  if (checkData && checkDataValues.includes(checkData) && !isResultSuccess(result)) {
    return Promise.reject(
      new BusinessError(result.executeCode, result.status, '服务器未响应 [data] 内容为'),
    )
  }

  // 业务成功，直接返回 RestResult 数据，简化调用方的使用
  return result
}

/**
 * 异常管理
 * 统一处理 HTTP 错误和网络错误
 *
 * @param error 错误信息
 */
async function responseError<T = unknown>(
  error: AxiosError<RestResult<T>>,
): Promise<AxiosError | Error | BusinessError | RestResult<T>> {
  // 如果错误状态码在忽略列表中，直接拒绝
  if (error.response && ignoreErrorStatus.includes(error.response.status)) {
    return Promise.resolve(error.response.data)
  }

  // 处理无响应的情况（网络错误）
  if (!error.response) {
    const errorMsg = '网络请求失败，请检查网络连接'
    message.error(errorMsg)
    return Promise.reject(new Error(errorMsg))
  }

  const response = error.response
  const status = response.status
  const result = response.data

  // 获取错误消息
  let serverMessage: string | undefined = result?.message

  if (!serverMessage) {
    const statusStr = status.toString()
    serverMessage = HTTP.ERROR_MESSAGES[statusStr] || `请求失败 (HTTP ${status})`
  }

  // 统一处理 401 未授权错误
  if (status === 401) {
    message.error('登录已过期，请重新登录')
    router.push({name: import.meta.env.VITE_APP_AUTH_PAGE_NAME}).catch(() => {})
    return Promise.reject(
      new BusinessError(result?.executeCode || '401', status, serverMessage, result?.data),
    )
  }

  // 检查是否有对应的错误页面路由
  const statusStr = status.toString()
  const errorRoute = router.getRoutes().find((r) => r.name === statusStr)
  if (errorRoute) {
    sessionStorage.setItem(statusStr, JSON.stringify(result?.data || []))
    router.push({name: statusStr}).catch(() => {
    })
    return Promise.reject(
      new BusinessError(result?.executeCode || statusStr, status, serverMessage, result?.data),
    )
  }

  // 格式化错误代码前缀
  let errorCodePrefix
  if (result?.executeCode) {
    errorCodePrefix = `[executeCode:${result.executeCode}] `
  } else {
    errorCodePrefix = `[HTTP ${status}] `
  }

  // 显示错误消息
  if (!ignoreErrorStatus.includes(status)) {
    message.error(errorCodePrefix + serverMessage)
  }

  // 返回业务错误对象
  return Promise.reject(
    new BusinessError(result?.executeCode || statusStr, status, serverMessage, result?.data),
  )
}

/**
 * 添加 http 请求拦截器
 */
axios.interceptors.request.use(requestInterceptor)

/**
 * 添加 http 响应拦截器
 * 使用类型断言，因为我们修改了返回类型为 RestResult 而不是 AxiosResponse
 */
axios.interceptors.response.use(responseInterceptor as never, responseError)

export default axios
