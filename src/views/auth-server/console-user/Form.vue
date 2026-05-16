<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {
  ConsoleUserEntity,
  ConsoleUserSavePayload
} from "@/types/auth-server/consoleUserDomain.js";
import type {NameValueEnumMetadata, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ConsoleUserService, ResourceServerService} from "@/apis";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceDomain.js";
import LRoleTable from "@/components/auth-server/RoleTable.vue";
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import type {RoleEntity} from "@/types/auth-server/roleDomain.js";
import type {TableProps} from "antdv-next"
import {SYSTEM_CONSTANT, VALID_REGX} from "@/constants/systemConstant.ts";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new ConsoleUserService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:ConsoleUserSavePayload
  genderOptions:NameValueEnumMetadata<number | string>[]
  statusOptions:NameValueEnumMetadata<number | string>[]
  spinning:boolean
}>({
  spinning: false,
  entity: {
    id:null as unknown as number,
    version:null as unknown as number,
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

const roleSelectedChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _selectedRowKeys,
  selectedRows
) => {
  const rows = selectedRows as RoleEntity[]
  options.value.entity.resourceIds = rows.flatMap((r) => r.resourceIds ?? [])
  options.value.entity.roleIds = rows.flatMap((r) => (r.id != null ? [r.id] : []))
}

function setPageTitle(title:string, entity: ConsoleUserEntity | ConsoleUserSavePayload) {
  if (entity.id) {
    return title + ' (' + entity.realName + ')'
  }
  return title
}

function resetFields() {
  options.value.entity.resourceIds = []
  options.value.entity.roleIds = []
}

</script>

<template>
  <div>
    <l-basic-form
      @resetFields="resetFields"
      operationDataTraceTarget="tb_console_user"
      :pre-mounted="mounted"
      :title-text="setPageTitle"
      :redirect="{name:'auth_server_user_console'}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="realName" :label="globalProperties.$t('common.realName')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.realName" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="username" :label="globalProperties.$t('auth.account')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.username" :disabled="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined"  />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="email" :label="globalProperties.$t('common.email')" :rules="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] ? undefined : [{type:'email'}]">
            <a-input v-model:value="options.entity.email" :disabled="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="phoneNumber" :label="globalProperties.$t('common.phoneNumber')" :rules="[{type: 'string', pattern:VALID_REGX.phoneNumber, message: globalProperties.$t('error.valid.phoneNumber')}]">
            <a-input v-model:value="options.entity.phoneNumber" :disabled="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="gender" :label="globalProperties.$t('common.gender')">
            <a-select v-model:value="options.entity.gender" :options="options.genderOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="status" :label="globalProperties.$t('common.status')">
            <a-select v-model:value="options.entity.status" :options="options.statusOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
      </template>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="icon-customer-group" />
          {{ globalProperties.$t('authServer.userRole') }}
        </a-space>
      </a-divider>

      <l-role-table :preview="true" root-class="mb-md" :query="{'filter_[enabled_eq]':'1', 'filter_[sources_jin]':'CONSOLE'}" :row-selection="{type: 'checkbox', selectedRowKeys: options.entity.roleIds, onChange: roleSelectedChange}"/>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="icon-template-success" />
          {{ globalProperties.$t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <l-resource-table :preview="true" root-class="mb-md" :query="{'filter_[enabled_eq]':'1', 'filter_[sources_jin]':'CONSOLE'}" :row-selection="{type: 'checkbox', selectedRowKeys: options.entity.resourceIds}"/>

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
