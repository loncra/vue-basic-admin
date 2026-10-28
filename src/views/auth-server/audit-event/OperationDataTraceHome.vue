<script setup lang="ts">
import {computed} from 'vue'
import dayjs from 'dayjs'
import type {AuditEventEntity} from '@loncra/client/auth'
import {createOperationTracePage, CrudHomePage} from '@loncra/antdv-pro'
import router from '@/routers'
import {postTimestampFormat} from '@/utils'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'

defineOptions({
  name: 'AuthServerOperationDataTraceHome',
})

const page = computed(() =>
  createOperationTracePage({afterDefault: postTimestampFormat(dayjs().startOf('d'))}),
)

function openDetail(record: AuditEventEntity): void {
  void router.push({
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE_DETAIL,
    query: {id: String(record.id), after: record.timestamp},
  })
}
</script>

<template>
  <div>
    <crud-home-page
      :page="page"
      :record-actions="[{id: 'detail'}]"
      :authority="{detail: 'perms[auth_server_audit_event:get]'}"
      @detail="openDetail"
    />
  </div>
</template>
