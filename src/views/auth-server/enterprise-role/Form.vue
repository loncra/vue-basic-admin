<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseRoleSavePayload, ResourceEntity} from '@loncra/client/auth'
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseRoleCore} from './enterprise-role.page'
import {enterpriseRoleFormPage, enterpriseRoleParent} from './enterprise-role.form.page'

defineOptions({
  name: 'AuthServerEnterpriseRoleForm',
})

const formRef = ref<{entity?: EnterpriseRoleSavePayload}>()
const {id} = useRequiredQuery(['id'], {required: false})

useEntityPageTitle(() => {
  const parent = enterpriseRoleParent.value
  if (parent) {
    return parent.name
  }
  return formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined
})

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: enterpriseRoleCore.routes?.home,
  entity: () => formRef.value?.entity,
})

const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="enterpriseRoleFormPage"
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
      class="mb-md"
      :page="resourceHomePage"
      :variant="RESOURCE_VARIANT.PICKER"
      :record-actions="false"
      :drag="false"
      :pagination="false"
      plain
      :title="false"
      :scroll="{x: 'max-content', y: 350}"
      :expand-icon-column-index="2"
      :fetch="fetchEnterpriseResources"
      :row-selection="resourceTreeSelection({
        dataSource: () => resourcePickerRef?.dataSource ?? [],
        selectedIds: () => entity.resourceIds,
        onChange: (ids) => { entity.resourceIds = ids },
      })"
    />

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>
  </crud-form-page>
</template>
