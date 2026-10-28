<script setup lang="ts">
import {ref} from 'vue'
import type {EmailMessageEntity} from '@loncra/client/message'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {emailCore} from './email.page'
import {emailDetailPage} from './email.detail.page'

defineOptions({
  name: 'MessageServerEmailDetail',
})

const detailRef = ref<{entity?: EmailMessageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

const {onStale} = usePageExit({redirect: emailCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="emailDetailPage"
    @stale="onStale"
  />
</template>
