import type {RouteTitleMap} from '@/types/composables/common'

export default {
  ai_server_model_setting_edit: () =>
    ['common.edit', {name: 'aiServer.modelSetting.routePage'}] as const,
  ai_server_model_setting_add: () =>
    ['common.add', {name: 'aiServer.modelSetting.routePage'}] as const,
  ai_server_model_setting_detail: () =>
    ['common.detail', {name: 'aiServer.modelSetting.routePage'}] as const,
} satisfies RouteTitleMap
