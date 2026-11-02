import i18n from '@/i18n'

export function requireNonNullOrUndefined<T>(obj: T | unknown | undefined): T {
  if (obj === null) {
    throw new Error('对象为 null')
  }

  if (obj === undefined) {
    throw new Error('对象为 undefined')
  }

  return obj as T
}

export function validatePassword(newPassword:string, confirmPassword:string, i18nKey:string='auth.newPassword') {
  if (confirmPassword !== newPassword) {
    const message = i18n.global.t(
      'error.notEq',
      {
        target:i18n.global.t(i18nKey),
        source:i18n.global.t('common.confirmPassword')
      }
    )
    return Promise.reject(message);
  } else {
    return Promise.resolve();
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
