import type {RouteTitleMap} from '../types/apis/common'

export default {
  '403': () => ['error.forbidden.page'] as const,
  '400': () => ['error.badRequest.page'] as const,
  '404': () => ['error.notFound.page'] as const,
  [import.meta.env.VITE_APP_AUTH_PAGE_NAME]: () => ['auth.page'] as const,
  [import.meta.env.VITE_APP_HOME_PAGE_NAME]: () => ['common.home'] as const,
} satisfies RouteTitleMap
