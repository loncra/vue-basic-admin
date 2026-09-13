import type {ObjectItemInfo} from '@loncra/client/resource'

export interface EditObjectItemInfo extends ObjectItemInfo {
  editing?: boolean
  content?: string
  key: string
  editName: string
}
