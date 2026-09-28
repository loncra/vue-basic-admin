<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import type {
  EnterpriseMemberEntity,
  EnterpriseRoleEntity,
  ResourceEntity
} from '@loncra/client/auth'
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  EnterpriseMemberService,
} from '@loncra/client/auth'
import {requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, inject, ref} from 'vue'
import {
  APP_RELOAD_PROVIDE_KEY,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  YES_OR_NO_TYPE
} from '@/constants'

import type {TableProps} from 'antdv-next'
import {AUDIT_STATUS_VALUE, getEnumName, getEnumValue} from '@loncra/client/commons'

import {CrudHomePage} from '@loncra/antdv-pro'
import {enterpriseRoleHomePage} from '@/views/auth-server/enterprise-role/enterprise-role.home.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import useApp from 'antdv-next/dist/app/useApp'

import {usePrincipalStore} from "@/stores/principalStore.ts";

import {useDateFormat} from '@loncra/antdv-pro'

const {dateTimeFormat} = useDateFormat()

defineOptions({
  name: 'AuthServerEnterpriseMemberDetail',
})

const reload = inject<() => void>(APP_RELOAD_PROVIDE_KEY)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const {message} = useApp()

/** 资源选择器的实例：树形勾选要按它当前的 `dataSource` 找祖先 / 子节点 */
const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()
const service = new EnterpriseMemberService()
const loading = ref(false)

const entity = ref<EnterpriseMemberEntity>({
  id: 0,
  version: 0,
  enterpriseId: 0,
  principal: '',
  username: '',
  role: AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.MEMBER,
  auditStatus: AUDIT_STATUS_VALUE.AUDITABLE,
  status: {
    value: 99,
    name: '',
  },
  initialization: {
    randomPassword: {
      value: YES_OR_NO_TYPE.YES,
      name: '',
    },
    randomUsername: {
      value: YES_OR_NO_TYPE.YES,
      name: '',
    },
  },
  emailVerified: 0,
  gender: 30,
  phoneNumberVerified: 0,
  systemName: "",
})

function displayName(record: EnterpriseMemberEntity) {
  return record.nickname || record.username || record.principal
}

const roleSelectedChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _selectedRowKeys,
  selectedRows
) => {
  const rows = selectedRows as EnterpriseRoleEntity[]
  entity.value.roleIds = rows.flatMap((r) => (r.id != null ? [r.id] : []))
  entity.value.resourceIds = [
    ...new Set([
      ...(entity.value.resourceIds ?? []),
      ...rows.flatMap((r) => r.resourceIds ?? []),
    ]),
  ]
}

async function onSave() {
  loading.value = true
  try {
    const result = await service.save(entity.value)
    message.success(result.message)
    reload?.()
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_MEMBER"
      :redirect="{name:AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.HOME}"
      :title-text="(title:string, _entity:EnterpriseMemberEntity) => title + ' (' + displayName(_entity) + ')'"
      :service="service"
      :column="{xxxl: 3,xxl: 3,xl: 3,lg: 3,md: 1,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.realName')">
        {{entity.nickname || ''}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('auth.account')">
        {{entity.username}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseMember.principal')">
        {{entity.principal}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseMember.role')">
        {{getEnumName(entity.role)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.auditStatus')">
        {{getEnumName(entity.auditStatus)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{getEnumName(entity.status)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.gender')">
        {{entity.gender ? getEnumName(entity.gender) : ''}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.phoneNumber')">
        {{entity.phoneNumber || ''}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.lastAuthenticationTime')">
        {{dateTimeFormat(entity.lastAuthenticationTime)}}
      </a-descriptions-item>
      <template #afterDescriptions>
        <a-divider titlePlacement="start" plain>
          <a-space>
            <icon-font class="icon" type="loncra-users-round" />
            {{ globalProperties.$t('authServer.userRole') }}
          </a-space>
        </a-divider>

        <!-- 角色表：换成 pro 的角色列表声明（旧组件的 `preview` = 不要行内动作；标题由上面的分割线给） -->
        <crud-home-page
          class="mb-md"
          :page="enterpriseRoleHomePage"
          :record-actions="false"
          :title="false"
          :query="{'filter_[enabled_eq]':'1'}"
          :row-selection="{
            type: 'checkbox',
            selectedRowKeys: entity.roleIds,
            onChange: roleSelectedChange,
            getCheckboxProps: () => ({disabled: getEnumValue(entity.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER}),
          }"
        />

        <a-divider titlePlacement="start" plain>
          <a-space>
            <icon-font class="icon" type="loncra-key-round" />
            {{ globalProperties.$t('authServer.standaloneResource') }}
          </a-space>
        </a-divider>

        <!-- 资源选择器：换成 pro 的资源列表声明；取数口换成 `/resource/find/enterprise`（`fetchEnterpriseResources`） -->
        <crud-home-page
          ref="resourcePickerRef"
          :page="resourceHomePage"
          :variant="RESOURCE_VARIANT.PICKER"
          :record-actions="false"
          :drag="false"
          :pagination="false"
          :title="false"
          :scroll="{x: 'max-content', y: 350}"
          :expand-icon-column-index="2"
          :fetch="fetchEnterpriseResources"
          :row-selection="resourceTreeSelection({
            dataSource: () => resourcePickerRef?.dataSource ?? [],
            selectedIds: () => entity.resourceIds,
            onChange: (ids) => { entity.resourceIds = ids },
            getCheckboxProps: () => ({
              disabled:
                getEnumValue(entity.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER ||
                !principalStore.hasPermission(AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.SAVE),
            }),
          })"
        />

      </template>
      <template #afterOperationDataTrace v-if="principalStore.hasPermission(AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.SAVE)">
        <a-divider />
        <a-button type="primary" @click="onSave" :loading="loading">
          <icon-font class="icon" type="loncra-save" v-if="!loading"/>
          {{ $t('common.save') }}
        </a-button>
      </template>
    </l-basic-detail>
  </div>
</template>
