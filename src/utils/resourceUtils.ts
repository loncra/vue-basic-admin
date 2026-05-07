// 导入 Ant Design Vue Next 组件和图标（antdv-next 无 List 组件，Chat.vue 中已用 div 替代）
import { h, resolveComponent } from 'vue'


/**
 * 天爱验证码数据接口
 * 包含验证码生成所需的参数和令牌信息
 */
interface TianaiCaptchaData {
  /** 验证码生成参数 */
  args: {
    generate: {
      /** 应用 ID */
      appId: string
      /** JavaScript 文件 URL */
      jsUrl: string
    }
  }
  /** 验证令牌信息 */
  token: {
    /** 令牌名称 */
    name: string
  }
}

/**
 * 天爱验证码配置接口
 * 用于初始化验证码组件的配置项
 */
interface TianaiCaptchaConfig {
  /** 基础 URL */
  baseUrl: string
  /** 应用 ID */
  appId: string
  /** 验证令牌 */
  token: string
  /** 验证成功回调函数 */
  success: (data: Record<string, unknown>) => void
  /** 验证失败回调函数 */
  error: (error: unknown) => void
}

/**
 * 天爱验证码实例接口
 * 表示已初始化的验证码组件实例
 */
interface TianaiCaptcha {
  /** 验证码配置对象 */
  config: {
    /** 验证令牌 */
    token: string
  }
  /** 隐藏验证码 */
  hide: () => void
}

/**
 * 天爱验证码构造函数声明
 * 用于 TypeScript 类型检查
 */
declare const TianaiCaptcha: {
  new (config: TianaiCaptchaConfig): TianaiCaptcha
}

/**
 * 验证天爱验证码的函数类型
 * @param token - 验证令牌
 * @param data - 验证数据
 * @returns Promise 对象，返回验证结果
 */
type VerifyTianaiCaptchaFn = (token: string, data: unknown) => Promise<unknown>

export function createIcon(type: string, classes: string = '') {
  return h(resolveComponent('IconFont'), { type, class: 'icon ' + classes })
}

/**
 * 动态加载 CSS 文件
 * 如果 CSS 文件已存在（通过 ID 判断），则直接返回现有元素；否则创建新的 link 标签并加载
 *
 * @param id - CSS 文件的唯一标识符，用于检查是否已加载
 * @param href - CSS 文件的 URL 地址
 * @returns Promise 对象，成功时返回 HTMLLinkElement，失败时 reject
 *
 * @example
 * ```typescript
 * loadCss('my-style', '/path/to/style.css')
 *   .then(link => console.log('CSS 加载成功', link))
 *   .catch(err => console.error('CSS 加载失败', err))
 * ```
 */
export function loadCss(id: string, href: string): Promise<HTMLLinkElement> {
  const doLoad = function (
    resolve: (value: HTMLLinkElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    // 检查是否已经存在相同 ID 的 link 标签
    const query = document.querySelector(`link[id='${id}']`) as HTMLLinkElement | null
    if (query) {
      // 如果已存在，直接返回
      resolve(query)
      return
    }

    // 创建新的 link 标签
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = href
    // 设置加载成功和失败的回调
    link.onload = () => resolve(link)
    link.onerror = reject
    // 添加到页面 head 中开始加载
    document.head.appendChild(link)
  }

  return new Promise(doLoad)
}

/**
 * 动态加载 JavaScript 文件
 * 如果 JavaScript 文件已存在（通过 ID 判断），则直接返回现有元素；否则创建新的 script 标签并加载
 *
 * @param id - JavaScript 文件的唯一标识符，用于检查是否已加载
 * @param href - JavaScript 文件的 URL 地址
 * @returns Promise 对象，成功时返回 HTMLScriptElement，失败时 reject
 *
 * @example
 * ```typescript
 * loadJs('my-script', '/path/to/script.js')
 *   .then(script => console.log('JS 加载成功', script))
 *   .catch(err => console.error('JS 加载失败', err))
 * ```
 */
export function loadJs(id: string, href: string): Promise<HTMLScriptElement> {
  const doLoad = function (
    resolve: (value: HTMLScriptElement) => void,
    reject: (reason?: unknown) => void,
  ) {
    // 检查是否已经存在相同 ID 的 script 标签
    const query = document.querySelector(`script[id='${id}']`) as HTMLScriptElement | null
    if (query) {
      // 如果已存在，直接返回
      resolve(query)
      return
    }

    // 创建新的 script 标签
    const script = document.createElement('script')
    script.id = id
    script.type = 'text/javascript'
    script.src = href
    // 设置加载成功和失败的回调
    script.onload = () => resolve(script)
    script.onerror = reject
    // 添加到页面 head 中开始加载
    document.head.appendChild(script)
  }

  return new Promise(doLoad)
}

/**
 * 加载天爱验证码组件
 * 首先加载验证码所需的 JavaScript 文件，然后初始化验证码实例
 * 验证成功后会自动调用验证函数进行服务端验证，并执行成功回调
 *
 * @param data - 验证码数据，包含生成参数和令牌信息
 * @param verifySuccess - 验证成功时的回调函数，接收验证结果数据
 * @param verifyError - 验证失败时的回调函数，默认为 console.error
 * @param verifyTianaiCaptcha - 服务端验证函数，用于验证验证码的有效性，必须提供
 * @returns Promise 对象，成功时返回 TianaiCaptcha 实例，失败时 reject
 *
 * @throws {Error} 当 verifyTianaiCaptcha 参数未提供时抛出错误
 *
 * @example
 * ```typescript
 * loadTianaiCaptcha(
 *   captchaData,
 *   (result) => console.log('验证成功', result),
 *   (error) => console.error('验证失败', error),
 *   async (token, data) => {
 *     // 调用服务端验证接口
 *     const response = await fetch('/api/verify-captcha', {
 *       method: 'POST',
 *       body: JSON.stringify({ token, data })
 *     });
 *     return response.json();
 *   }
 * )
 * ```
 */
export function loadTianaiCaptcha(
  data: TianaiCaptchaData,
  verifySuccess: (data: unknown) => void,
  verifyError: (error: unknown) => void = console.error,
  verifyTianaiCaptcha: VerifyTianaiCaptchaFn,
): Promise<TianaiCaptcha> {
  // 验证 verifyTianaiCaptcha 参数是否提供
  if (!verifyTianaiCaptcha) {
    throw new Error('verifyTianaiCaptcha function is required')
  }

  /**
   * 创建天爱验证码实例
   * @param data - 验证码数据
   * @param reject - Promise reject 函数，用于处理错误
   * @returns 验证码实例
   */
  const createTianaiCaptcha = function (
    data: TianaiCaptchaData,
    reject: (error: unknown) => void,
  ): TianaiCaptcha {
    let tianaiCaptcha: TianaiCaptcha | null = null

    /**
     * 验证码验证成功回调
     * 当用户完成验证码操作后，会调用此函数进行服务端验证
     */
    const onSuccess = function (data: Record<string, unknown>) {
      /**
       * 清理验证码实例
       * 验证完成后隐藏并释放验证码资源
       */
      const cleanupObject = function () {
        if (tianaiCaptcha) {
          tianaiCaptcha.hide()
          tianaiCaptcha = null
        }
      }
      // 执行服务端验证
      if (tianaiCaptcha) {
        verifyTianaiCaptcha(tianaiCaptcha.config.token, data.data)
          .then(verifySuccess)
          .then(cleanupObject)
          .catch(verifyError)
      }
    }

    // 创建验证码实例
    tianaiCaptcha = new TianaiCaptcha({
      baseUrl: import.meta.env.VITE_APP_SERVER_API_URL + '/resource',
      appId: data.args.generate.appId,
      token: data.token.name,
      success: onSuccess,
      error: reject,
    })
    return tianaiCaptcha
  }
  /**
   * 加载验证码 JavaScript 文件（如果尚未加载）
   * 通过添加时间戳参数避免浏览器缓存问题
   */
  const loadIfNotExist = function (
    resolve: (value: TianaiCaptcha) => void,
    reject: (error: unknown) => void,
  ) {
    // 加载验证码 JS 文件，添加时间戳避免缓存
    loadJs('tianai', data.args.generate.jsUrl + '?date=' + new Date().getTime()).then(() =>
      resolve(createTianaiCaptcha(data, reject)),
    )
  }

  return new Promise(loadIfNotExist)
}
