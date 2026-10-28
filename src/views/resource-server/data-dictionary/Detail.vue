<script setup lang="ts">
import {ref} from 'vue'
import type {DataDictionaryEntity} from '@loncra/client/resource'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {dataDictionaryCore} from './data-dictionary.page'
import {dataDictionaryDetailPage} from './data-dictionary.detail.page'

defineOptions({
  name: 'ResourceServerDataDictionaryDetail',
})

const detailRef = ref<{entity?: DataDictionaryEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: dataDictionaryCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="dataDictionaryDetailPage"
    @stale="onStale"
  />
</template>
