<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {EnterpriseMemberService} from '@/apis/auth-server/enterpriseMemberService.ts'
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref, watch} from 'vue'
import type {EnterpriseMemberEntity} from '@/types/apis/auth-server/enterpriseMemberDomain'
import {
  AUDIT_STATUS_VALUE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  YES_OR_NO_TYPE,
} from '@/constants'
import type {EnterpriseRoleEntity, ResourceEntity} from '@/types/apis'
import type {TableProps} from 'antdv-next'

import LEnterpriseRoleTable from '@/components/auth-server/EnterpriseRoleTable.vue'
import LResourceTable from '@/components/auth-server/ResourceTable.vue'
import {ResourceService} from '@/apis/auth-server/resourceService'
import useApp from 'antdv-next/dist/app/useApp'

defineOptions({
  name: 'AuthServerEnterpriseMemberDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message} = useApp()

const resourceDataSource = ref<ResourceEntity[]>([])
const roleDataSource = ref<EnterpriseRoleEntity[]>([])
const resourceService = new ResourceService()
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
  lastAuthenticationTime: 0,
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

const resourceSelectedChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _selectedRowKeys
) => {
  entity.value.resourceIds = _selectedRowKeys as number[]
}

async function postGetEntity(entity: EnterpriseMemberEntity) {
  const result = await resourceService.findEnterprise({})
  resourceDataSource.value = result.data ?? []
  return entity
}

async function onSave() {
  loading.value = true
  try {
    const result = await service.save(entity.value)
    message.success(result.message)
  } finally {
    loading.value = false
  }
}

watch(roleDataSource,(roles) => entity.value.resourceIds = roles.flatMap((r) => r.resourceIds ?? []))

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_MEMBER"
      :post-get-entity="postGetEntity"
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
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-users-round" />
            {{ globalProperties.$t('authServer.userRole') }}
          </a-space>
        </a-divider>

        <l-enterprise-role-table v-model:data-source="roleDataSource" preview hide-title root-class="mb-md" :query="{'filter_[enabled_eq]':'1'}" :row-selection="{type: 'checkbox', selectedRowKeys: entity.roleIds, onChange: roleSelectedChange}"/>

        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-key-round" />
            {{ globalProperties.$t('authServer.standaloneResource') }}
          </a-space>
        </a-divider>

        <l-resource-table
          ref="resourceTableRef"
          :immediate="false"
          :drag="false"
          hide-title
          v-model:data-source="resourceDataSource"
          :row-selection="{fixed:true, type: 'checkbox', selectedRowKeys: entity.resourceIds,onChange: resourceSelectedChange}"
        />
      </template>
      <template #afterOperationDataTrace>
        <a-divider />
        <a-button type="primary" @click="onSave">
          <icon-font class="icon" type="loncra-save" />
          {{ $t('common.save') }}
        </a-button>
      </template>
    </l-basic-detail>
  </div>
</template>
