<script setup lang="ts">
import {computed, inject, ref} from 'vue'
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AuthServerService,
  type EnterpriseMemberEntity,
  type EnterpriseRoleEntity,
  type ResourceEntity
} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import type {TableProps} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {APP_RELOAD_PROVIDE_KEY} from '@/constants'
import {usePrincipalStore} from '@/stores/principalStore'
import {enterpriseRoleHomePage} from '@/views/auth-server/enterprise-role/enterprise-role.home.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseMemberCore, enterpriseMemberService} from './enterprise-member.page'
import {enterpriseMemberDetailPage} from './enterprise-member.detail.page'

defineOptions({
  name: 'AuthServerEnterpriseMemberDetail',
})

const detailRef = ref<{entity?: EnterpriseMemberEntity}>()

const {ok, id} = useRequiredQuery()

const entity = computed(() => detailRef.value?.entity)

const reload = inject<() => void>(APP_RELOAD_PROVIDE_KEY)
const principalStore = usePrincipalStore()
const {message} = useApp()

function displayName(): string | undefined {
  const record = entity.value
  return record ? AuthServerService.getPrincipalNameByUserDetails(record) : undefined
}
useEntityPageTitle(displayName)

const {onStale} = usePageExit({redirect: enterpriseMemberCore.routes?.home})

const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()

const roleSelectedChange: NonNullable<TableProps['rowSelection']>['onChange'] = (
  _selectedRowKeys,
  selectedRows,
) => {
  const current = entity.value
  if (!current) {
    return
  }
  const rows = selectedRows as EnterpriseRoleEntity[]
  current.roleIds = rows.flatMap((r) => (r.id != null ? [r.id] : []))
  current.resourceIds = [
    ...new Set([
      ...(current.resourceIds ?? []),
      ...rows.flatMap((r) => r.resourceIds ?? []),
    ]),
  ]
}

const loading = ref(false)

async function onSave(): Promise<void> {
  const current = entity.value
  if (!current) {
    return
  }
  loading.value = true
  try {
    const result = await enterpriseMemberService.save(current)
    message.success(result.message)
    reload?.()
  } finally {
    loading.value = false
  }
}

function canSave(): boolean {
  return principalStore.hasPermission(AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.SAVE)
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseMemberDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity: member}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-users-round" />
          {{ $t('authServer.userRole') }}
        </a-space>
      </a-divider>

      <crud-home-page
        class="mb-md"
        :page="enterpriseRoleHomePage"
        :record-actions="false"
        :title="false"
        plain
        :query="{'filter_[enabled_eq]':'1'}"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: member.roleIds,
          onChange: roleSelectedChange,
          getCheckboxProps: () => ({disabled: getEnumValue(member.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER}),
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
        plain
        :pagination="false"
        :title="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :fetch="fetchEnterpriseResources"
        :row-selection="resourceTreeSelection({
          dataSource: () => resourcePickerRef?.dataSource ?? [],
          selectedIds: () => member.resourceIds,
          onChange: (ids) => { member.resourceIds = ids },
          getCheckboxProps: () => ({
            disabled:
              getEnumValue(member.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER ||
              !canSave(),
          }),
        })"
      />
    </template>
    <template #afterOperationDataTrace v-if="canSave()">
      <div class="mb-md" />
      <a-button type="primary" @click="onSave" :loading="loading">
        <icon-font class="icon" type="loncra-save" v-if="!loading" />
        {{ $t('common.save') }}
      </a-button>
    </template>
  </crud-detail-page>
</template>
