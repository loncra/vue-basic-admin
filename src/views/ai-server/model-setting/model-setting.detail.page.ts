import {h} from 'vue'
import {Space} from 'antdv-next'
import {
  AI_SERVER_MODEL_TYPE,
  MODEL_DEFAULT_OPTIONS_KEY,
  type ModelSettingEntity
} from '@loncra/client/ai'
import {defineDetailPage} from '@loncra/antdv-pro'
import {
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  VALUE_TYPE,
  YES_OR_NO_TYPE
} from '@loncra/client/commons'
import {renderIconFont} from '@/utils'
import {modelSettingCore} from './model-setting.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const modelSettingDetailPage = defineDetailPage(modelSettingCore, {
  column: COLUMN,
  createEntity: () => ({
    id: 0,
    version: 0,
    name: '',
    model: '',
    icon: null,
    type: AI_SERVER_MODEL_TYPE.CHAT,
    enabled: YES_OR_NO_TYPE.YES,
    remark: '',
    description: '',
    manufacturer: {
      code: '',
      name: '',
      value: '',
      valueType: VALUE_TYPE.STRING,
      metadata: {},
    },
    metadata: {[MODEL_DEFAULT_OPTIONS_KEY]: {}},
  }),
  fields: [
    'id',
    'name',
    'model',
    {key: 'icon', render: (value) => renderIconFont(String(value || 'loncra-sticker'))},
    'type',
    'enabled',
    {
      key: 'manufacturer',
      render: (_value, entity: ModelSettingEntity) =>
        h(Space, null, {
          default: () => [
            renderIconFont(String(entity.manufacturer?.metadata?.icon || 'loncra-building')),
            h('span', null, entity.manufacturer?.name || ''),
          ],
        }),
    },
    'sort',
    {key: 'description', span: 'filled'},
    {key: 'remark', span: 'filled'},
  ],
  enums: [{module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.YES_OR_NO]}],
})
