import type {ExportDataMetadata} from '@loncra/client/resource'
import {UserExportService} from '@loncra/client/resource'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {CrudPageCore} from '@loncra/antdv-pro'

const userExportService = new UserExportService()

export const userExportCore: CrudPageCore<ExportDataMetadata, ExportDataMetadata> = {
  service: userExportService,
  i18nPrefix: 'resourceServer.userExport',

  fields: {
    creationTime: {labelKey: 'common.creationTime'},
    filename: {labelKey: 'resourceServer.attachment.filename'},
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.IMPORT_EXPORT_TYPE_ENUM},
    },
    size: {labelKey: 'common.size'},
    executeStatus: {
      labelKey: 'common.executeStatus',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.EXECUTE_STATUS_ENUM},
    },
    successTime: {labelKey: 'common.successTime'},
    expiresTime: {labelKey: 'common.expiresTime'},
  },
}
