<script setup lang="ts">
import {ref} from 'vue'
import {AUTH_SERVER_AUTHENTICATION_TYPE, type PersonalUserEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {personalUserCore} from './personal-user.page'
import {personalUserDetailPage} from './personal-user.detail.page'
import {roleHomePage} from "@/views/auth-server/role/role.home.page.ts";
import {ROLE_VARIANT} from "@/views/auth-server/role/role.page.ts";
import {resourceHomePage} from "@/views/auth-server/resource/resource.home.page.ts";
import {RESOURCE_VARIANT} from "@/views/auth-server/resource/resource.page.ts";

defineOptions({
  name: 'AuthServerPersonalUserDetail',
})

const detailRef = ref<{entity?: PersonalUserEntity}>()

const roleOrResourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL],
})

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entity = detailRef.value?.entity
  return entity ? entity.nickname || entity.username || undefined : undefined
})

const {onStale} = usePageExit({redirect: personalUserCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="personalUserDetailPage"
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
        :query="roleOrResourceQuery"
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
        :query="roleOrResourceQuery"
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
