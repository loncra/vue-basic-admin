import {AUTH_SERVER_ENTERPRISE_MEMBER_ROLE} from '@loncra/client/auth'

export {
  AUTHENTICATION_MEMBER_TYPE,
  AUTH_SERVER_AUTHENTICATION_TYPE_PARAM,
  AUTH_SERVER_CONSOLE_USER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY,
  AUTH_SERVER_PERSONAL_USER_AUTHORITY,
  AUTH_SERVER_RESOURCE_AUTHORITY,
  AUTH_SERVER_ROLE_AUTHORITY,
  AUTH_SERVER_SYSTEM_USER_AUTHORITY,
} from '@loncra/client/auth'

export const AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE = {
  HOME: 'auth_server_enterprise_member',
  DETAIL: 'auth_server_enterprise_member_detail',
} as const

export const AUTH_SERVER_ENTERPRISE_ROUTE = {
  HOME: 'auth_server_enterprise',
  DETAIL: 'auth_server_enterprise_detail',
} as const

export const AUTH_SERVER_AUDIT_EVENT_ROUTE = {
  AUTHENTICATION: 'auth_server_audit_event_authentication',
  OPERATION_DATA_TRACE: 'auth_server_audit_event_operation_data_trace',
  AUTHENTICATION_DETAIL: 'auth_server_audit_event_authentication_detail',
  OPERATION_DATA_TRACE_DETAIL: 'auth_server_audit_event_operation_data_trace_detail',
} as const

export const AUTH_SERVER_CONSOLE_USER_ROUTE = {
  HOME: 'auth_server_user_console',
  EDIT: 'auth_server_console_user_edit',
  ADD: 'auth_server_console_user_add',
  DETAIL: 'auth_server_console_user_detail',
} as const

export const AUTH_SERVER_PERSONAL_USER_ROUTE = {
  HOME: 'auth_server_personal_user',
  DETAIL: 'auth_server_personal_user_detail',
} as const

export const AUTH_SERVER_RESOURCE_ROUTE = {
  HOME: 'auth_server_resource',
  ADD_CHILD: 'auth_server_resource_add_child',
  EDIT: 'auth_server_resource_edit',
  ADD: 'auth_server_resource_add',
  DETAIL: 'auth_server_resource_detail',
} as const

export const AUTH_SERVER_ROLE_ROUTE = {
  HOME: 'auth_server_role',
  ADD_CHILD: 'auth_server_role_add_child',
  EDIT: 'auth_server_role_edit',
  ADD: 'auth_server_role_add',
  DETAIL: 'auth_server_role_detail',
} as const

export const AUTH_SERVER_ENTERPRISE_ROLE_ROUTE = {
  HOME: 'auth_server_enterprise_role',
  ADD_CHILD: 'auth_server_enterprise_role_add_child',
  EDIT: 'auth_server_enterprise_role_edit',
  ADD: 'auth_server_enterprise_role_add',
  DETAIL: 'auth_server_enterprise_role_detail',
} as const

export const AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE = {
  HOME: 'auth_server_enterprise_invitation',
  DETAIL: 'auth_server_enterprise_invitation_detail',
  CONFIRM: 'auth_server_enterprise_invitation_confirm',
} as const

export const AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR: Record<number, string> = {
  [AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER]: 'gold',
  [AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.MEMBER]: 'green',
}

export const AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON: Record<number, string> = {
  [AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER]: 'loncra-crown',
  [AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.MEMBER]: 'loncra-user-round',
}
