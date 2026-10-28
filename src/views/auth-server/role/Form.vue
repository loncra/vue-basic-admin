<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity, RoleSavePayload} from '@loncra/client/auth'
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_VARIANT, resourceTreeSelection,} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {roleCore} from './role.page'
import {roleFormPage} from './role.form.page'

defineOptions({
  name: 'AuthServerRoleForm',
})

const formRef = ref<{entity?: RoleSavePayload}>()
const {id} = useRequiredQuery(['id'], {required: false})

const resourcePickerRef = ref<{
  fetchDataSource?: () => void
  clearDataSource?: () => void
  dataSource?: ResourceEntity[]
}>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

const contextExtra = {resourceTable: resourcePickerRef, resourceQuery}

useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined))

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: roleCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="roleFormPage"
    :context-extra="contextExtra"
    @success="onSuccess"
    @stale="onStale"
    v-slot="{entity}"
  >
    <a-divider class="m-0 mb-md" titlePlacement="start" plain>
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
      root-class="mb-md"
      :query="resourceQuery"
      :row-selection="resourceTreeSelection({
        dataSource: () => resourcePickerRef?.dataSource ?? [],
        selectedIds: () => entity.resourceIds,
        onChange: (ids) => { entity.resourceIds = ids },
      })"
    />
  </crud-form-page>
</template>
