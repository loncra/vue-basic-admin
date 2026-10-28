<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {roleCore} from './role.page'
import {roleDetailPage} from './role.detail.page'

defineOptions({
  name: 'AuthServerRoleDetail',
})

const detailPageRef = ref<{entity?: ResourceEntity & {id?: number}}>()

const {ok, id} = useRequiredQuery()

const resourcePickerRef = ref<{fetchDataSource?: () => void}>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

const contextExtra = {resourceTable: resourcePickerRef, resourceQuery}

useEntityPageTitle(() => detailPageRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: roleCore.routes?.home})

watch(
  [resourcePickerRef, () => detailPageRef.value?.entity?.id],
  () => {
    if (resourcePickerRef.value && detailPageRef.value?.entity?.id) {
      resourcePickerRef.value.fetchDataSource?.()
    }
  },
  {immediate: true},
)
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailPageRef"
    :id="id"
    :page="roleDetailPage"
    :context-extra="contextExtra"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-key-round" />
          {{ $t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <crud-home-page
        ref="resourcePickerRef"
        :page="resourceHomePage"
        :variant="RESOURCE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :immediate="false"
        :pagination="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :title="false"
        plain
        :query="resourceQuery"
        :row-selection="{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: entity.resourceIds,
          getCheckboxProps: () => ({disabled: true}),
        }"
      />
    </template>
  </crud-detail-page>
</template>
