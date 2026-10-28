<script setup lang="ts">
import {getCurrentInstance, ref} from 'vue'
import type {AuditEventEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'
import {auditEventDetailPage} from './audit-event.detail.page'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'AuthServerAuditEventDetail',
})

const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const t = globalProperties.$t
const configProvider = useConfigProviderStore()
const detailRef = ref<{entity?: AuditEventEntity}>()

const {ok, id, after} = useRequiredQuery(['id', 'after'], {numeric: false})

const {onStale} = usePageExit({
  redirect:
    globalProperties.$route.name === AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION_DETAIL
      ? AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION
      : AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE,
})

interface DetailSection {
  show: boolean
  icon: string
  plain: boolean
  title: string
  source: Record<string, unknown> | undefined
}

function sectionsOf(entity: AuditEventEntity): DetailSection[] {
  const data = entity.data as
    | {
        details?: Record<string, unknown>
        metadata?: {
          headers?: Record<string, unknown>
          parameters?: Record<string, unknown>
          body?: Record<string, unknown>
        }
        operationTrace?: Record<string, unknown>
      }
    | undefined
  return [
    {
      show: !!data?.details,
      icon: 'loncra-user-round',
      plain: true,
      title: `${t('Crud.operationTrace.principal')} ${t('common.basicInformation')}`,
      source: data?.details,
    },
    {
      show: !!data?.metadata?.headers,
      icon: 'loncra-file-code',
      plain: false,
      title: `${t('common.request.header')} ${t('common.basicInformation')}`,
      source: data?.metadata?.headers,
    },
    {
      show: !!data?.metadata?.parameters,
      icon: 'loncra-file-code-corner',
      plain: false,
      title: `${t('common.request.parameter')} ${t('common.basicInformation')}`,
      source: data?.metadata?.parameters,
    },
    {
      show: !!data?.metadata?.body,
      icon: 'loncra-file-code-corner',
      plain: true,
      title: `${t('common.request.body')} ${t('common.basicInformation')}`,
      source: data?.metadata?.body,
    },
    {
      show: !!data?.operationTrace,
      icon: 'loncra-file-search',
      plain: true,
      title: t('Crud.operationTrace.data'),
      source: data?.operationTrace,
    },
  ]
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="auditEventDetailPage"
    :context-extra="{after}"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <template v-for="section of sectionsOf(entity)" :key="section.title">
        <template v-if="section.show">
          <a-divider title-placement="start" :plain="section.plain">
            <a-space>
              <icon-font class="icon align" :type="section.icon" />
              <span>{{ section.title }}</span>
            </a-space>
          </a-divider>
          <a-descriptions
            bordered
            :layout="configProvider.antdv.state.detailLayout"
            :column="{xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1}"
            class="mt-lg"
          >
            <a-descriptions-item v-for="(value, key) in section.source" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>
      </template>
    </template>
  </crud-detail-page>
</template>
