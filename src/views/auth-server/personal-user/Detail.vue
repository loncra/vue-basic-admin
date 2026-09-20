<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import type {PersonalUserEntity} from '@loncra/client/auth'
import {AUTH_SERVER_GENDER, PersonalUserService} from '@loncra/client/auth'
import {requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {
  AUTH_SERVER_PERSONAL_USER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  YES_OR_NO_TYPE
} from '@/constants'
import {getEnumName} from '@loncra/client/commons'

import {useDateFormat} from '@loncra/antdv-pro'

const {dateTimeFormat} = useDateFormat()

defineOptions({
  name: 'AuthServerPersonalUserDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new PersonalUserService()
const entity = ref<PersonalUserEntity>({
  id: 0,
  version: 0,
  systemName: '',
  username: '',
  nickname: '',
  emailVerified: YES_OR_NO_TYPE.NO,
  phoneNumberVerified: YES_OR_NO_TYPE.NO,
  gender: AUTH_SERVER_GENDER.UNKNOWN,
  lastAuthenticationTime: 0,
  phoneNumber: '',
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
  type: {
    name: '',
    value: '',
  },
})

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.PERSONAL_USER"
      :redirect="{name:AUTH_SERVER_PERSONAL_USER_ROUTE.HOME}"
      :title-text="(title:string, _entity:PersonalUserEntity) => title + ' (' + (_entity.nickname || _entity.username) + ')'"
      :service="service"
      :column="{xxxl: 4,xxl: 4,xl: 4,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.realName')">
        {{entity.nickname}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('auth.account')">
        {{entity.username}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.email')">
        {{entity.email}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.phoneNumber')">
        {{entity.phoneNumber}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.gender')">
        {{ getEnumName(entity.gender)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{ getEnumName(entity.status)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.lastAuthenticationTime')">
        {{ dateTimeFormat(entity.lastAuthenticationTime)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.randomPassword')">
        {{ getEnumName(entity.initialization.randomPassword) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.randomUsername')">
        {{ getEnumName(entity.initialization.randomUsername) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.personalUser.promoCode')">
        {{ entity.promoCode || '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterprise.tenantId')">
        {{ entity.tenantId || '' }}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
