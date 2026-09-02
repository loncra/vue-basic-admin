export const DATA_DICTIONARY_ALL_VALUE = "*"
export const DATA_DICTIONARY_ALL_CODE = "system.all"

export const RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY = {
  FIND: 'perms[resource_server_data_dictionary:find]',
  GET: 'perms[resource_server_data_dictionary:get]',
  SAVE: 'perms[resource_server_data_dictionary:save]',
  DELETE: 'perms[resource_server_data_dictionary:delete]',
  SORT: 'perms[resource_server_data_dictionary:sort]',
} as const

export const RESOURCE_SERVER_DATA_DICTIONARY_ROUTE = {
  HOME: 'resource_server_dictionary',
  ADD_CHILD: 'resource_server_data_dictionary_add_child',
  ADD: 'resource_server_data_dictionary_add',
  EDIT: 'resource_server_data_dictionary_edit',
  DETAIL: 'resource_server_data_dictionary_detail',
} as const

export const RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY = {
  FIND: 'perms[resource_server_dictionary_type:find]',
  GET: 'perms[resource_server_dictionary_type:get]',
  SAVE: 'perms[resource_server_dictionary_type:save]',
  DELETE: 'perms[resource_server_dictionary_type:delete]'
} as const

export const RESOURCE_SERVER_CAROUSEL_AUTHORITY = {
  SAVE: 'perms[resource_server_carousel:save]',
  GET: 'perms[resource_server_carousel:get]',
  EXPORT: 'perms[resource_server_carousel:export]',
  DELETE: 'perms[resource_server_carousel:delete]',
  RELEASE: 'perms[resource_server_carousel:release]',
  REVOKE: 'perms[resource_server_carousel:revoke]',
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

export const CAPTCHA_TOKEN_TYPE = {
  SMS:'sms',
  EMAIL:'email',
  TIANAI:'tianai'
}
