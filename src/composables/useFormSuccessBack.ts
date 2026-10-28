import {h, ref} from 'vue'
import {App, Checkbox} from 'antdv-next'
import type {RestResult} from '@loncra/client/commons'
import i18n from '@/i18n'
import {CREATE_SUCCESS_BACK} from '@/constants'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {type PageExitRedirect, usePageExit} from '@/composables/usePageExit'

export function useFormSuccessBack(options: {
  redirect?: PageExitRedirect
  entity: () => {id?: unknown} | undefined
}) {
  const {modal} = App.useApp()
  const configProviderStore = useConfigProviderStore()
  const {backToList, onStale} = usePageExit({redirect: options.redirect})
  const t = (key: string) => i18n.global.t(key)
  const rememberMe = ref(false)
  const formKey = ref(0)

  function resetForm(): void {
    formKey.value += 1
  }

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
        width:520,
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
