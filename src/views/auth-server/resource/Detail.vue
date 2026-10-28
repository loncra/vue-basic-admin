<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceSavePayload} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceCore} from './resource.page'
import {resourceDetailPage} from './resource.detail.page'

defineOptions({
  name: 'AuthServerResourceDetail',
})

const detailRef = ref<{entity?: ResourceSavePayload}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: resourceCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="resourceDetailPage"
    @stale="onStale"
  />
</template>
