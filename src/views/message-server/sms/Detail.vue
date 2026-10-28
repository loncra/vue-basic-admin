<script setup lang="ts">
import {ref} from 'vue'
import type {SmsMessageEntity} from '@loncra/client/message'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {smsCore} from './sms.page'
import {smsDetailPage} from './sms.detail.page'

defineOptions({
  name: 'MessageServerSmsDetail',
})

const detailRef = ref<{entity?: SmsMessageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

const {onStale} = usePageExit({redirect: smsCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="smsDetailPage"
    @stale="onStale"
  />
</template>
