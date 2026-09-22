import {ref} from 'vue'
import {defineHomePage, iconNameCell} from '@loncra/antdv-pro'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import type {ModelSettingEntity, ModelSettingSavePayload} from '@loncra/client/ai'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  AI_SERVER_MODEL_SETTING_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {modelSettingCore} from './model-setting.page'

/**
 * 选中的厂商（左侧树）：壳里的菜单点它、声明里的新增/批量删除用它决定显不显示
 * ⇒ 状态放声明（两侧共用一份），壳只负责渲染与点击。
 */
export const selectedManufacturer = ref<DataDictionaryMetadata | null>(null)

/** 模型设置列表（`Home.vue`）。核心在 `model-setting.page.ts`，这里只写列表形态。 */
export const modelSettingHomePage = defineHomePage<ModelSettingSavePayload, ModelSettingEntity>(
  modelSettingCore,
  {
    authority: {
      add: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
      edit: AI_SERVER_MODEL_SETTING_AUTHORITY.SAVE,
      delete: AI_SERVER_MODEL_SETTING_AUTHORITY.DELETE,
      detail: AI_SERVER_MODEL_SETTING_AUTHORITY.GET,
    },
    enums: [
      {module: SYSTEM_MODULE_NAME.AI_SERVER, ids: [SYSTEM_ENUM_TYPE.MODEL_TYPE_ENUM]},
      {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.YES_OR_NO]},
    ],
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {
        key: 'name',
        search: defineSearchProps('input'),
        // 名称前带图标：布局在 pro（`iconNameCell`），图标怎么画由宿主注入
        // （旧实现没图标时用 `loncra-sticker`，所以这里给的是"兜底图标"而不是名称首字）
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
    /** 没选厂商时列表本来就是空的，新增 / 批量删除没有意义 ⇒ 按 id 覆盖默认动作的 `visible` */
    toolbarActions: [
      {id: 'add', visible: () => selectedManufacturer.value !== null},
      {id: 'deleteSelected', visible: () => selectedManufacturer.value !== null},
    ],
  },
)
