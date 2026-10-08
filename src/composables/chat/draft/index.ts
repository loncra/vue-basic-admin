import {clearPrincipalDrafts} from '@loncra/chat-core/dexie'

export function clearPrincipal(principal: string): Promise<void> {
  return clearPrincipalDrafts(principal)
}
