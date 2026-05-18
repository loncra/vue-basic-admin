import type {RouteTitleMap} from '../../types/apis/common'

export default {
  resource_server_data_dictionary_addChild: () =>
    ['common.addChild', {name: 'resourceServer.dataDictionary.routePage'}] as const,
  resource_server_data_dictionary_edit: () =>
    ['common.edit', {name: 'resourceServer.dataDictionary.routePage'}] as const,
  resource_server_data_dictionary_add: () =>
    ['common.add', {name: 'resourceServer.dataDictionary.routePage'}] as const,
  resource_server_data_dictionary_detail: () =>
    ['common.detail', {name: 'resourceServer.dataDictionary.routePage'}] as const,
} satisfies RouteTitleMap
