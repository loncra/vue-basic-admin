export {
  CAPTCHA_TOKEN_TYPE,
  RESOURCE_SERVER_CAROUSEL_AUTHORITY,
  RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY,
  RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY,
} from '@loncra/client/resource'

export const DATA_DICTIONARY_ALL_VALUE = "*"
export const DATA_DICTIONARY_ALL_CODE = "system.all"

export const RESOURCE_SERVER_DATA_DICTIONARY_ROUTE = {
  HOME: 'resource_server_dictionary',
  ADD_CHILD: 'resource_server_data_dictionary_add_child',
  ADD: 'resource_server_data_dictionary_add',
  EDIT: 'resource_server_data_dictionary_edit',
  DETAIL: 'resource_server_data_dictionary_detail',
} as const

export const RESOURCE_SERVER_ATTACHMENT_ROUTE = {
  FILE_MANAGER: 'resource_server_file_manager',
  MY_RESOURCE: 'resource_server_my_resource',
} as const

export const RESOURCE_SERVER_CAROUSEL_ROUTE = {
  HOME: 'resource_server_carousel',
  EDIT: 'resource_server_carousel_edit',
  ADD: 'resource_server_carousel_add',
} as const

