<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseRoleEntity, ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseRoleCore} from './enterprise-role.page'
import {enterpriseRoleDetailPage} from './enterprise-role.detail.page'

defineOptions({
  name: 'AuthServerEnterpriseRoleDetail',
})

const detailRef = ref<{entity?: EnterpriseRoleEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: enterpriseRoleCore.routes?.home})

const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseRoleDetailPage"
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
        plain
        :pagination="false"
        :title="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :fetch="fetchEnterpriseResources"
        :row-selection="resourceTreeSelection({
          dataSource: () => resourcePickerRef?.dataSource ?? [],
          selectedIds: () => entity.resourceIds,
          onChange: () => {},
          getCheckboxProps: () => ({disabled: true}),
        })"
      />
    </template>
  </crud-detail-page>
</template>
