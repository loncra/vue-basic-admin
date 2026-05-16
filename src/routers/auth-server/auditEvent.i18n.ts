import type {RouteTitleMap} from '@/types/common'

export default {
  auth_server_audit_event_authentication_detail: () =>
    ['common.detail', {name: 'auth.log'}] as const,
  auth_server_audit_event_operation_data_trace_detail: () =>
    ['common.detail', {name: 'form.operationDataTrace'}] as const,
} satisfies RouteTitleMap
