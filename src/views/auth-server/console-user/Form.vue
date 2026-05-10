<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {ConsoleUserEntity} from "@/types/auth-server/consoleUserType.ts";
import type {NameValueEnumMetadata, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ConsoleUserService, ResourceServerService} from "@/apis";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";

defineOptions({
  name: 'LAuthServerConsoleUserForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const consoleUserService = new ConsoleUserService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:ConsoleUserEntity,
  genderOptions:NameValueEnumMetadata<number | string>[],
  statusOptions:NameValueEnumMetadata<number | string>[],
  spinning:boolean,
}>({
  spinning: false,
  entity: {
    realName: "",
    gender: 30,
    phoneNumber: "",
    remark: "",
    email: "",
    username: "",
    status: 1
  },
  genderOptions:[],
  statusOptions:[],
})

async function mounted() {
  options.value.spinning = true
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"GenderEnum"}, {"id":"UserStatus"}]})
  if (enums.data) {
    const responseBody: EnumBucketsResponseBody = enums.data
    const resourceServer = responseBody['resource-server'] ?? {}

    options.value.genderOptions = resourceServer.GenderEnum ?? []
    options.value.statusOptions = resourceServer.UserStatus ?? []
  }

  options.value.spinning = false
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-basic-form :service="consoleUserService" :entity="options.entity" :spinning="options.spinning">
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="realName" :label="globalProperties.$t('authServerConsoleUser.realName')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.realName" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="username" :label="globalProperties.$t('authServerConsoleUser.username')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.username" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="email" :label="globalProperties.$t('authServerConsoleUser.email')" :rules="[{type:'email'}]">
            <a-input v-model:value="options.entity.email" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="phoneNumber" :label="globalProperties.$t('authServerConsoleUser.phoneNumber')" :rules="[{type:'phone'}]">
            <a-input v-model:value="options.entity.phoneNumber" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="gender" :label="globalProperties.$t('authServerConsoleUser.gender')">
            <a-select v-model:value="options.entity.gender" :options="options.genderOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="status" :label="globalProperties.$t('authServerConsoleUser.status')">
            <a-select v-model:value="options.entity.status" :options="options.statusOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
      </template>

      <a-form-item name="remark" :label="globalProperties.$t('authServerConsoleUser.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
