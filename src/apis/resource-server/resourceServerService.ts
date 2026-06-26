/**
 * @file 资源服务（resource-server）— 枚举等辅助 API
 * @description 与 auth-server 的 {@link AuthServerService} 类似，为 **实例方法 + 静态 URL**；
 * 提供跨服务的枚举桶查询（POST 批量 / GET 单枚举），不纳入 CRUD 继承树。
 */
import axios from "@/requests/http.ts";
import type {
  CaptchaToken,
  CaptchaTokenType,
  EnumBucketsRequestBody,
  EnumBucketsResponseBody,
  RestResult
} from "@/types/apis";
import {formUrlEncoded, loadJs} from "@/utils";
import {CAPTCHA_TOKEN_TYPE} from "@/constants/messageConstant.ts";
import type {TianaiCaptchaInstance} from "../../../env";

/**
 * resource-server 侧通用查询（当前仅封装枚举相关接口）。
 *
 * @author maurice.chen
 */
export class ResourceServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server' : '')

  /** 枚举桶批量查询 */
  static readonly GET_SERVICE_ENUMERATE_URL = ResourceServerService.BASE_URL + '/enumerate'

  static readonly CAPTCHA_GENERATE_GENERATE_TOKEN_URL = ResourceServerService.BASE_URL + '/captcha/generateToken'
  static readonly CAPTCHA_GENERATE_CAPTCHA_TOKEN_URL = ResourceServerService.BASE_URL + '/captcha/generateCaptcha'

  /** `POST .../enumerate`：按请求体拉取多组枚举 */
  static getServiceEnumerates(filter: EnumBucketsRequestBody): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.post(ResourceServerService.GET_SERVICE_ENUMERATE_URL, filter)
  }

  /** `GET .../enumerate/{service}/{enumerateName}`：单枚举 */
  static getServiceEnumerate(service: string, enumerateName:string): Promise<RestResult<EnumBucketsResponseBody>> {
    return axios.get(ResourceServerService.GET_SERVICE_ENUMERATE_URL + '/' + service + '/' + enumerateName)
  }

  static generateCaptchaToken(type:CaptchaTokenType):Promise<RestResult<CaptchaToken>> {
    return axios.get(ResourceServerService.CAPTCHA_GENERATE_GENERATE_TOKEN_URL,{params: formUrlEncoded({type})})
  }

  static generateCaptcha(params:Record<string, unknown>):Promise<RestResult<Record<string, unknown>>> {
    return axios.post(ResourceServerService.CAPTCHA_GENERATE_CAPTCHA_TOKEN_URL,formUrlEncoded(params))
  }

  static async createTianaiCaptchaInstance(
    captchaToken:CaptchaToken,
    onSuccess:(result: { data:string }) => void,
    onCancel:() => void
  ): Promise<TianaiCaptchaInstance | undefined> {
    await loadJs(String(captchaToken.type), (captchaToken.args.generate as {jsUrl:string}).jsUrl)
    if (TianaiCaptcha) {
      return new TianaiCaptcha({
        baseUrl:import.meta.env.VITE_APP_SERVER_URL,
        token:captchaToken.token.name,
        success:onSuccess,
        cancel:onCancel
      })
    }
    return undefined
  }

  static createGenerateTokenParam(captchaToken:CaptchaToken, append?:Record<string, unknown>):Record<string, unknown> {
    return  {
      captchaType:captchaToken.type,
      [captchaToken.tokenParamName]: captchaToken.token.name,
      ...append
    }
  }

  static sendCaptcha(
    type:CaptchaTokenType,
    append?:Record<string, unknown>
  ):Promise<Record<string, unknown>> {
    return new Promise(async (resolve, reject) => {
      let instance: { hide: () => void; show: () => void; } | undefined = undefined
      try {
        const generateTokenResult:RestResult<CaptchaToken> = await ResourceServerService.generateCaptchaToken(type)
        if (!generateTokenResult.data) {
          return reject(generateTokenResult)
        }

        const generateToken = generateTokenResult.data

        if (!generateTokenResult.data.interceptToken) {
          const params = ResourceServerService.createGenerateTokenParam(generateToken,append || {})
          const result:RestResult<Record<string, unknown>> = await ResourceServerService.generateCaptcha(params)
          resolve({
            generateResult:result.data,
            token:generateToken
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
                  [(generateToken.interceptToken.args.post as {captchaParamName:string}).captchaParamName]:instanceResult.data
                }
              )
              const params = ResourceServerService.createGenerateTokenParam(
                generateToken,
                {
                  ...append || {},
                }
              )
              instance?.hide()
              try {
                const result:RestResult<Record<string, unknown>> = await ResourceServerService.generateCaptcha({...tianaiParams, ...params})

                resolve({
                  generateResult:result.data,
                  token:generateTokenResult.data
                })
              } catch (e) {
                reject(e)
              }
            },
            () => reject(new Error('cancel'))
          )
          instance?.show()
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  static sendEmailCaptcha(
    email:string,
    messageType:string
  ) {
    return ResourceServerService.sendCaptcha(CAPTCHA_TOKEN_TYPE.EMAIL, {email, messageType})
  }

  static sendPhoneNumberCaptcha(
    phoneNumber:string,
    messageType:string
  ) {
    return ResourceServerService.sendCaptcha(CAPTCHA_TOKEN_TYPE.SMS, {phoneNumber, messageType})
  }
}
