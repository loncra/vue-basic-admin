import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {EnterpriseService} from '@loncra/client/auth'
import {type CrudFormCore, defineFormPage} from '@loncra/antdv-pro'
import {ICON_SELECT_MODE} from '@loncra/antdv'
import {OPERATION_DATA_TRACE_TABLE} from '@loncra/client/commons'
import {renderIconFont} from '@/utils'

export const enterpriseSettingService = new EnterpriseService()

export const enterpriseSettingCore: CrudFormCore<EnterprisePayload, EnterpriseEntity> = {
  service: enterpriseSettingService,
  i18nPrefix: 'systemSetting.enterprise',
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE,
  fields: {
    name: {labelKey: 'common.name'},
    icon: {labelKey: 'common.icon'},
    remark: {labelKey: 'common.remark'},
  },
}

export const enterpriseSettingFormPage = defineFormPage(enterpriseSettingCore, {
  createEntity: () => ({name: '', icon: undefined, remark: ''}),
  fields: [
    {key: 'name', component: 'input', col: {span: 24}, rules: [{required: true}]},
    {
      key: 'icon',
      component: 'iconSelect',
      col: {span: 24},
      props: {mode: ICON_SELECT_MODE.AVATAR, iconRender: renderIconFont},
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 3, showCount: true, maxlength: 256},
    },
  ],
})
