import {h, ref} from 'vue'
import {App, Checkbox} from 'antdv-next'
import type {RestResult} from '@loncra/client/commons'
import type {RouteLocationRaw} from 'vue-router'
import i18n from '@/i18n'
import {CREATE_SUCCESS_BACK} from '@/constants'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {usePageExit} from '@/composables/usePageExit'

/**
 * 表单**保存成功后**的宿主策略（旧 `BasicForm.vue` 的 `doSubmit` 尾部 + `createdAfterSetting` 搬过来）。
 *
 * pro 的壳只 `emit('success')` —— "回列表 / 关 tab / 记住偏好 / 再来一条"是宿主环境，所以在这儿：
 * - **编辑**：回列表 + 关掉当前 tab（pro 自己已经提示过成功，不重复弹）；
 * - **新增**：按 `createSuccessBack` 偏好决定 —— 没设过就弹框（带"记住我的操作"勾选），
 *   设过就直接回列表（`HOME`）或留在原地（`CURRENT`）；
 * - "再来一条 / 留在原地"用**换 `key` 重挂表单壳**实现清空（等价旧 `formRef.resetFields()` +
 *   声明的 `onReset`，而且连不在表单字段里的 `roleIds` / `resourceIds` 也一并清干净）。
 *
 * 用法：`<crud-form-page :key="formKey" @success="onSuccess" @stale="onStale">`
 */
export function useFormSuccessBack(options: {
  /** 回列表的去处（页面的 `routes.home`）；给不出就只关 tab */
  redirect?: RouteLocationRaw
  /** 当前实体（用 `id` 判新增 / 编辑） */
  entity: () => {id?: unknown} | undefined
}) {
  const {modal} = App.useApp()
  const configProviderStore = useConfigProviderStore()
  const {backToList, onStale} = usePageExit({redirect: options.redirect})
  const t = (key: string) => i18n.global.t(key)
  const rememberMe = ref(false)
  /** "再来一条 / 留在原地"：+1 就重挂表单壳 ⇒ 回到初值 */
  const formKey = ref(0)

  function resetForm(): void {
    formKey.value += 1
  }

  /** `@success`（pro 的壳已经提示过成功，这里只决定去向） */
  function onSuccess(result: RestResult<unknown>): void {
    if (options.entity()?.id != null) {
      backToList()
      return
    }
    const preference = configProviderStore.state.createSuccessBack
    if (!preference) {
      modal.confirm({
        title: t('form.createSuccess.title'),
        content: `${result.message} ${t('form.createSuccess.subTitle')}`,
        okText: t('form.createSuccess.okReturnList'),
        cancelText: t('form.createSuccess.addAnother'),
        onOk: () => {
          if (rememberMe.value) {
            configProviderStore.setCreateSuccessBack(CREATE_SUCCESS_BACK.HOME)
          }
          backToList()
        },
        onCancel: () => {
          if (rememberMe.value) {
            configProviderStore.setCreateSuccessBack(CREATE_SUCCESS_BACK.CURRENT)
          }
          resetForm()
        },
        footer: ({extra}: {extra: {OkBtn: unknown; CancelBtn: unknown}}) => [
          // "记住我的操作"勾选（旧页面的行为，别丢）
          h(
            Checkbox,
            {
              checked: rememberMe.value,
              'onUpdate:checked': (value: boolean) => (rememberMe.value = value),
              class: 'mr',
            },
            {default: () => t('common.rememberOperate')},
          ),
          h(extra.OkBtn as never),
          h(extra.CancelBtn as never),
        ],
      })
      return
    }
    if (preference === CREATE_SUCCESS_BACK.HOME) {
      backToList()
      return
    }
    resetForm()
  }

  return {onSuccess, onStale, backToList, formKey}
}
