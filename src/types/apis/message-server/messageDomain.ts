import type {IdNameMetadata} from '@loncra/client/commons'
import type {MessageGroup} from '@loncra/client/message'

export interface MyMessageState {
  record?: Partial<Record<MessageGroup, Record<number, unknown>>> | undefined
  siteTypes?: IdNameMetadata[]
}
