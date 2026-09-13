import type {Dayjs} from 'dayjs'
import type {
  EnterpriseInvitationSavePayload as ClientInvitationSavePayload
} from '@loncra/client/auth'

export interface EnterpriseInvitationSavePayload
  extends Omit<ClientInvitationSavePayload, 'expirationTime'> {
  expirationTime?: number | Dayjs
}
