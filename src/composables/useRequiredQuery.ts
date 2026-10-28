import {inject, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import i18n from '@/i18n'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY, SYSTEM_ROUTE} from '@/constants'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'

export interface RequiredQueryOptions {
  anyOf?: boolean
  numeric?: boolean
  required?: boolean
}

export type RequiredQueryResult<T extends string, V = number> = {
  ok: boolean
  missing: string[]
} & Record<T, V | undefined>

export function useRequiredQuery<T extends string = typeof SYSTEM_CONSTANT.ID_NAME>(
  fields: readonly T[],
  options: RequiredQueryOptions & {numeric: false},
): RequiredQueryResult<T, string>
export function useRequiredQuery<T extends string = typeof SYSTEM_CONSTANT.ID_NAME>(
  fields?: readonly T[],
  options?: RequiredQueryOptions,
): RequiredQueryResult<T, number>
export function useRequiredQuery<T extends string = typeof SYSTEM_CONSTANT.ID_NAME>(
  fields: readonly T[] = [SYSTEM_CONSTANT.ID_NAME] as unknown as readonly T[],
  options: RequiredQueryOptions = {},
): RequiredQueryResult<T, number | string> {
  const route = useRoute()
  const router = useRouter()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  const numeric = options.numeric ?? true
  const values: Record<string, number | string | undefined> = {}
  for (const field of fields) {
    const raw = route.query[field]
    const single = (Array.isArray(raw) ? raw[0] : raw) ?? undefined
    const text = single ?? ''
    if (text === '') {
      values[field] = undefined
    } else if (!numeric) {
      values[field] = text
    } else {
      const num = Number(text)
      values[field] = Number.isNaN(num) ? undefined : num
    }
  }

  const missing = options.anyOf
    ? Object.keys(values).every((field) => values[field] == null)
      ? [...fields]
      : []
    : fields.filter((field) => values[field] == null)
  const ok = missing.length === 0

  onMounted(() => {
    if (options.required === false || ok) {
      return
    }
    sessionStorage.setItem(
      import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
      JSON.stringify(
        missing.map((field) => ({
          code: SYSTEM_ROUTE.BAD_REQUEST,
          field,
          defaultMessage: i18n.global.t('error.notNull', {field}),
        })),
      ),
    )
    router.push({name: SYSTEM_ROUTE.BAD_REQUEST})
    closeLayoutTab?.(route.fullPath, false)
  })

  return {ok, missing, ...values} as RequiredQueryResult<T>
}
