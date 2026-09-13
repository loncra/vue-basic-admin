import {
  CAPTCHA_TOKEN_TYPE,
  ResourceServerService as ResourceServerClient,
} from '@loncra/client/resource'
import type {CaptchaToken, CaptchaTokenType, RestResult} from '@loncra/client/commons'
import {loadJs} from '@/utils'
import type {TianaiCaptchaInstance} from '../../../env'

/**
 * 验证码弹层 / 点天爱依赖浏览器与 Vite env，留在管理端。
 */
export class ResourceServerService extends ResourceServerClient {
  static async createTianaiCaptchaInstance(
    captchaToken: CaptchaToken,
    onSuccess: (result: {data: string}) => void,
    onCancel: () => void,
  ): Promise<TianaiCaptchaInstance | undefined> {
    await loadJs(String(captchaToken.type), (captchaToken.args.generate as {jsUrl: string}).jsUrl)
    if (TianaiCaptcha) {
      return new TianaiCaptcha({
        baseUrl: import.meta.env.VITE_APP_SERVER_URL,
        token: captchaToken.token.name,
        success: onSuccess,
        cancel: onCancel,
      })
    }
    return undefined
  }

  static sendCaptcha(
    type: CaptchaTokenType,
    append?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return new Promise(async (resolve, reject) => {
      let instance: {hide: () => void; show: () => void} | undefined = undefined
      try {
        const generateTokenResult: RestResult<CaptchaToken> =
          await ResourceServerService.generateCaptchaToken(type)
        if (!generateTokenResult.data) {
          return reject(generateTokenResult)
        }

        const generateToken = generateTokenResult.data

        if (!generateTokenResult.data.interceptToken) {
          const params = ResourceServerService.createGenerateTokenParam(
            generateToken,
            append || {},
          )
          const result: RestResult<Record<string, unknown>> =
            await ResourceServerService.generateCaptcha(params)
          resolve({
            generateResult: result.data,
            token: generateToken,
          })
        } else if (generateTokenResult.data.interceptToken.type === 'tianai') {
          instance = await ResourceServerService.createTianaiCaptchaInstance(
            generateTokenResult.data.interceptToken as CaptchaToken,
            async (instanceResult) => {
              if (!generateToken.interceptToken) {
                return reject(generateToken.interceptToken)
              }
              const tianaiParams = ResourceServerService.createGenerateTokenParam(
                generateToken.interceptToken as CaptchaToken,
                {
                  [(generateToken.interceptToken.args.post as {captchaParamName: string})
                    .captchaParamName]: instanceResult.data,
                },
              )
              const params = ResourceServerService.createGenerateTokenParam(generateToken, {
                ...append || {},
              })
              instance?.hide()
              try {
                const result: RestResult<Record<string, unknown>> =
                  await ResourceServerService.generateCaptcha({...tianaiParams, ...params})
                resolve({
                  generateResult: result.data,
                  token: generateTokenResult.data,
                })
              } catch (e) {
                reject(e)
              }
            },
            () => reject(new Error('cancel')),
          )
          instance?.show()
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static sendEmailCaptcha(email: string, messageType: string) {
    return ResourceServerService.sendCaptcha(CAPTCHA_TOKEN_TYPE.EMAIL, {email, messageType})
  }

  static sendPhoneNumberCaptcha(phoneNumber: string, messageType: string) {
    return ResourceServerService.sendCaptcha(CAPTCHA_TOKEN_TYPE.SMS, {phoneNumber, messageType})
  }
}
