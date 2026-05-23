import type {ActionAuth} from '@/types/composables'
import {usePrincipalStore} from '@/stores/principalStore.ts'

export function useActionAuth(): ActionAuth {
  const principalStore = usePrincipalStore()

  return {
    can: (permission) => {
      if (permission === undefined || permission === false) {
        return false
      }
      if (permission === true) {
        return true
      }
      return principalStore.hasPermission(permission as string) || !!permission
    },
  }
}
