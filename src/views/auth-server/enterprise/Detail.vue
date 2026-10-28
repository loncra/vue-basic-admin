<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {enterpriseCore} from './enterprise.page'
import {enterpriseDetailPage} from './enterprise.detail.page'

defineOptions({
  name: 'AuthServerEnterpriseDetail',
})

const detailRef = ref<{entity?: EnterpriseEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: enterpriseCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseDetailPage"
    @stale="onStale"
  />
</template>
