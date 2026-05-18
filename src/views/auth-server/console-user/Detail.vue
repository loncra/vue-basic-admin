<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {ConsoleUserService} from "@/apis";
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {ConsoleUserEntity} from "@/types/apis/auth-server/consoleUserDomain";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new ConsoleUserService()
const entity = ref<ConsoleUserEntity>({
  version: 0,
  emailVerified: {
    value:0,
    name:'否'
  },
  phoneNumberVerified:{
    value:0,
    name:'否'
  },
  gender: {
    value:30,
    name:'位置性别'
  },
  id: 0,
  initialization:{
    randomPassword: {
      value: 1,
      name:'是'
    },
    randomUsername:{
      value: 1,
      name:'是'
    }
  },
  lastAuthenticationTime: 0,
  phoneNumber: "",
  realName: "",
  status: {
    value: 99,
    name:'位置性别'
  },
  type: {
    name:'',
    value:'CONSOLE'
  },
  username: ""

})

</script>

<template>
  <div>
    <l-basic-detail
      operationDataTraceTarget="tb_console_user"
      :redirect="{name:'auth_server_user_console'}"
      :title-text="(title:string, _entity:ConsoleUserEntity) => title + ' (' + _entity.realName + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.realName')">
        {{entity.realName}}
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

      <a-descriptions-item :label="globalProperties.$t('common.remark')">
        {{ entity.remark || '' }}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
