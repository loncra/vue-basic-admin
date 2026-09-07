<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {EnterpriseInvitationService} from '@/apis/auth-server/enterpriseInvitationService.ts'
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {EnterpriseInvitationEntity} from '@/types/apis/auth-server/enterpriseInvitationDomain'
import {
  AUTH_SERVER_ENTERPRISE_INVITATION_AUDITS,
  AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE,
  AUTH_SERVER_ENTERPRISE_INVITATION_STATUS,
  OPERATION_DATA_TRACE_TABLE,
} from '@/constants'
import {AuthServerService} from "@/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import type {EnterpriseMemberEntity} from "@/types/apis";

defineOptions({
  name: 'AuthServerEnterpriseInvitationDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseInvitationService()
const entity = ref<EnterpriseInvitationEntity>({
  id: 0,
  version: 0,
  enterpriseId: 0,
  status: AUTH_SERVER_ENTERPRISE_INVITATION_STATUS.EXECUTION,
  expirationTime: 0,
  roles: [],
  auditType:AUTH_SERVER_ENTERPRISE_INVITATION_AUDITS.AUTOMATIC,
  member: null as unknown as EnterpriseMemberEntity,
  principal: "",
  roleIds: []
})

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_INVITATION"
      :redirect="{name:AUTH_SERVER_ENTERPRISE_INVITATION_ROUTE.HOME}"
      :title-text="(title:string, _entity:EnterpriseInvitationEntity) => title + ' (' + _entity.member ? AuthServerService.getPrincipalNameByUserDetails(_entity.member) : _entity.principal + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseInvitation.inviterPrincipal')">
        <a-space>
          <l-user-avatar :user="entity.member" />
          {{AuthServerService.getPrincipalNameByUserDetails(entity.member)}}
        </a-space>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{getEnumName(entity.status)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseInvitation.roleId')">
        {{ (entity.roles || []).map(s => s.name).join(', ') }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.expiresTime')">
        {{entity.expirationTime ? dateTimeFormat(entity.expirationTime) : globalProperties.$t('common.permanent')}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseInvitation.auditType')">
        {{getEnumName(entity.auditType)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">
        {{dateTimeFormat(entity.creationTime)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterprise.tenantId')">
        {{entity.tenantId || ''}}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
