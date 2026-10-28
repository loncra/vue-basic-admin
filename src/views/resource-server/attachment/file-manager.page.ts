import {FileManagerService, type ObjectItemInfo} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'

export const fileManagerService = new FileManagerService()

export const fileManagerCore: CrudPageCore<ObjectItemInfo, ObjectItemInfo> = {
  service: fileManagerService,
  i18nPrefix: 'resourceServer.attachment',
}
