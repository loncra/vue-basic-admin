/// <reference types="vite/client" />

export interface TianaiCaptchaOptions {
    baseUrl: string
    token: string
    success: (result: { data: string }) => void
    cancel: () => void
}
export interface TianaiCaptchaInstance {
    show(): void
    hide(): void
}
export interface TianaiCaptchaConstructor {
    new(options: TianaiCaptchaOptions): TianaiCaptchaInstance
}
declare global {
    /** 由 loadJs 加载的外部脚本注入的全局构造函数 */
    const TianaiCaptcha: TianaiCaptchaConstructor | undefined
}
export { }