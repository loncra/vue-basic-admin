<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {EnterpriseMemberService} from '@/apis/auth-server/enterpriseMemberService.ts'
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {EnterpriseMemberEntity} from '@/types/apis/auth-server/enterpriseMemberDomain'
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_INVITATION,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  YES_OR_NO_TYPE,
} from '@/constants'

defineOptions({
  name: 'AuthServerEnterpriseMemberDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseMemberService()
const entity = ref<EnterpriseMemberEntity>({
  id: 0,
  version: 0,
  enterpriseId: 0,
  principal: '',
  username: '',
  role: AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.MEMBER,
  invitation: AUTH_SERVER_ENTERPRISE_MEMBER_INVITATION.INVITED,
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
  systemName: ""
})

function displayName(record: EnterpriseMemberEntity) {
  return record.nickname || record.username || record.principal
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
      <a-descriptions-item :label="globalProperties.$t('authServer.enterpriseMember.invitation')">
        {{getEnumName(entity.invitation)}}
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
    </l-basic-detail>
  </div>
</template>
