import {ref} from 'vue'
import {defineHomePage, iconNameCell} from '@loncra/antdv-pro'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import type {ModelSettingEntity, ModelSettingSavePayload} from '@loncra/client/ai'
import {AI_SERVER_MODEL_SETTING_AUTHORITY} from '@loncra/client/ai'
import {defineSearchProps, renderIconFont} from '@/utils'
import {modelSettingCore} from './model-setting.page'

export const selectedManufacturer = ref<DataDictionaryMetadata | null>(null)

export const modelSettingHomePage = defineHomePage<ModelSettingSavePayload, ModelSettingEntity>(
  modelSettingCore,
  {
    authority: {
      add: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
      edit: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
      delete: AI_SERVER_MODEL_SETTING_AUTHORITY.DELETE,
      detail: AI_SERVER_MODEL_SETTING_AUTHORITY.GET,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {
        key: 'name',
        search: defineSearchProps('input'),
        render: iconNameCell({
          renderIcon: renderIconFont,
          nameOf: (record) => record.name,
          iconOf: (record) => record.icon || 'loncra-sticker',
        }),
      },
      {key: 'model', search: defineSearchProps('input')},
      {key: 'type', search: defineSearchProps('select')},
      {key: 'enabled', search: defineSearchProps('select')},
    ],
    toolbarActions: [
      {id: 'add', visible: () => selectedManufacturer.value !== null},
      {id: 'deleteSelected', visible: () => selectedManufacturer.value !== null},
    ],
  },
)
