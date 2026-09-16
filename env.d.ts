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

    interface Window {
        /** index.html 中的启动骨架（App Shell），早于 Vue 存在 */
        __boot?: {
            /** 复位骨架（重试时恢复 spinner、清掉错误） */
            reset: () => void
            /** 写入状态文案（由 i18n 翻译后传入） */
            setStatus: (text: string) => void
            /** 展示错误与重试按钮 */
            showError: (message: string, retryLabel: string, onRetry?: () => void) => void
            /** 启动完成、目标页面已渲染后移除骨架 */
            remove: () => void
        }
    }
}
export { }