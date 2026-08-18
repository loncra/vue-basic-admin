/** 对齐后端 CarouselTypeEnum */
export const CAROUSEL_TYPE = {
  PC: 10,
  APP: 20,
  APPLET: 30,
} as const

/** 对齐后端 ValueTypeEnum */
export const VALUE_TYPE = {
  INTEGER: 10,
  DOUBLE: 20,
  STRING: 30,
  DATE: 40,
  DATE_TIME: 50,
  TIME: 60,
} as const

export const DATA_DICTIONARY_ALL_VALUE = "*"
export const DATA_DICTIONARY_ALL_CODE = "system.all"

export const DATA_DICTIONARY_AUTHORITY = {
  FIND: 'perms[resource_server_data_dictionary:find]',
  GET: 'perms[resource_server_data_dictionary:get]',
  SAVE: 'perms[resource_server_data_dictionary:save]',
  DELETE: 'perms[resource_server_data_dictionary:delete]',
  SORT: 'perms[resource_server_data_dictionary:sort]',
} as const

export const DATA_DICTIONARY_ROUTE = {
  ADD: 'resource_server_data_dictionary_add',
  EDIT: 'resource_server_data_dictionary_edit',
  DETAIL: 'resource_server_data_dictionary_detail',
} as const

export const DICTIONARY_TYPE_AUTHORITY = {
  FIND: 'perms[resource_server_dictionary_type:find]',
  GET: 'perms[resource_server_dictionary_type:get]',
  SAVE: 'perms[resource_server_dictionary_type:save]',
  DELETE: 'perms[resource_server_dictionary_type:delete]'
} as const

export const CAROUSEL_AUTHORITY = {
  SAVE: 'perms[resource_server_carousel:save]',
  GET: 'perms[resource_server_carousel:get]',
  EXPORT: 'perms[resource_server_carousel:export]',
  DELETE: 'perms[resource_server_carousel:delete]',
  RELEASE: 'perms[resource_server_carousel:release]',
  REVOKE: 'perms[resource_server_carousel:revoke]',
} as const
