<script setup lang="ts">
import {ref} from 'vue'
import type {TableProps} from 'antdv-next'
import type {ConsoleUserSavePayload, RoleEntity} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {ROLE_VARIANT} from '@/views/auth-server/role/role.page'
import {roleHomePage} from '@/views/auth-server/role/role.home.page'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {consoleUserCore} from './console-user.page'
import {consoleUserFormPage} from './console-user.form.page'

defineOptions({
  name: 'AuthServerConsoleUserForm',
})

const formRef = ref<{entity?: ConsoleUserSavePayload}>()
const {id} = useRequiredQuery(['id'], {required: false})

const roleQuery = {
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
}
const resourceQuery = {...roleQuery}

useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.realName : undefined))

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: consoleUserCore.routes?.home,
  entity: () => formRef.value?.entity,
})

function roleSelection(entity: ConsoleUserSavePayload) {
  const onChange: NonNullable<TableProps['rowSelection']>['onChange'] = (_selectedRowKeys, selectedRows) => {
    const roles = selectedRows as RoleEntity[]
    entity.roleIds = roles.flatMap((r) => (r.id != null ? [r.id] : []))
    entity.resourceIds = [
      ...new Set([...(entity.resourceIds ?? []), ...roles.flatMap((r) => r.resourceIds ?? [])]),
    ]
  }
  return {type: 'checkbox', selectedRowKeys: entity.roleIds, onChange}
}
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="consoleUserFormPage"
    @success="onSuccess"
    @stale="onStale"
    v-slot="{entity}"
  >
    <a-divider class="m-0 mb-md" titlePlacement="start" plain>
      <a-space>
        <icon-font class="icon" type="loncra-users-round" />
        {{ $t('authServer.userRole') }}
      </a-space>
    </a-divider>

    <crud-home-page
      :page="roleHomePage"
      :variant="ROLE_VARIANT.PICKER"
      :record-actions="false"
      :query="roleQuery"
      plain
      :row-selection="roleSelection(entity)"
      :title="false"
    />

    <a-divider titlePlacement="start" class="mb-md mt-md" plain>
      <a-space>
        <icon-font class="icon" type="loncra-key-round" />
        {{ $t('authServer.standaloneResource') }}
      </a-space>
    </a-divider>

    <crud-home-page
      :page="resourceHomePage"
      :variant="RESOURCE_VARIANT.PICKER"
      :record-actions="false"
      :drag="false"
      :pagination="false"
      :scroll="{x: 'max-content', y: 350}"
      :expand-icon-column-index="2"
      :query="resourceQuery"
      :row-selection="{type: 'checkbox', selectedRowKeys: entity.resourceIds}"
      :title="false"
      plain
      root-class="mb-md"
    />

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>
  </crud-form-page>
</template>
