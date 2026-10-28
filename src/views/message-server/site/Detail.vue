<script setup lang="ts">
import {ref} from 'vue'
import type {SiteMessageEntity} from '@loncra/client/message'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {siteCore} from './site.page'
import {siteDetailPage} from './site.detail.page'

defineOptions({
  name: 'MessageServerSiteDetail',
})

const detailRef = ref<{entity?: SiteMessageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

const {onStale} = usePageExit({redirect: siteCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="siteDetailPage"
    @stale="onStale"
  />
</template>
