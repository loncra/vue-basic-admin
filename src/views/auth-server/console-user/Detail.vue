<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ConsoleUserSavePayload, ResourceEntity, RoleEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {consoleUserCore} from './console-user.page'
import {consoleUserDetailPage} from './console-user.detail.page'
import {resourceHomePage} from "@/views/auth-server/resource/resource.home.page.ts";
import {RESOURCE_VARIANT} from "@/views/auth-server/resource/resource.page.ts";
import {roleHomePage} from "@/views/auth-server/role/role.home.page.ts";
import {applySources, ROLE_VARIANT} from "@/views/auth-server/role/role.page.ts";

defineOptions({
  name: 'AuthServerConsoleUserDetail',
})

const detailRef = ref<{entity?: ConsoleUserSavePayload}>()
const rolePickerRef = ref<CrudHomePageExpose<RoleEntity>>()
const resourcePickerRef = ref<CrudHomePageExpose<ResourceEntity>>()

const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

watch(
  [() => rolePickerRef.value?.dataSource, () => detailRef.value?.entity?.roleIds],
  () => {
    const roleRows = rolePickerRef.value?.dataSource ?? []
    const roleIds = detailRef.value?.entity?.roleIds ?? []
    if (roleRows.length === 0 || roleIds.length === 0) {
      return
    }
    const sources: unknown[] = []
    for (const role of roleRows) {
      if (role.id == null || !roleIds.includes(role.id)) {
        continue
      }
      if (Array.isArray(role.sources)) {
        sources.push(...role.sources)
      }
    }
    applySources({extra: {resourceQuery, resourceTable: resourcePickerRef}}, sources)
  },
  {immediate: true},
)

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.realName)

const {onStale} = usePageExit({redirect: consoleUserCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="consoleUserDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider class="mb-md" titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-users-round" />
          {{ $t('authServer.userRole') }}
        </a-space>
      </a-divider>

      <crud-home-page
        ref="rolePickerRef"
        :page="roleHomePage"
        :variant="ROLE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :pagination="false"
        plain
        :scroll="{x: 'max-content', y: 350}"
        :title="false"
        :row-selection="{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: entity.roleIds,
          getCheckboxProps: () => ({disabled: true}),
        }"
      />

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
        :pagination="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :title="false"
        plain
        :immediate="false"
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
