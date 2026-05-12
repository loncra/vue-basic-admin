<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {NameValueEnumMetadata, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ResourceServerService} from "@/apis";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import type {RoleEntity, RoleSavePayload} from "@/types/auth-server/roleType.ts";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import type {FilterRequest} from "@/types/common.ts";
import type {OptionProps} from "antdv-next/dist/mentions/index";
import {getEnumValue} from "@/utils/commonUtils.ts";

defineOptions({
  name: 'LAuthServerConsoleUserForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new RoleService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:RoleSavePayload
  modifiableOptions:NameValueEnumMetadata<number>[]
  enabledOptions:NameValueEnumMetadata<number>[]
  removableOptions:NameValueEnumMetadata<number>[]
  sourceOptions:NameValueEnumMetadata<string>[]
  parentOptions:RoleEntity[]
  spinning:boolean
  query:FilterRequest
}>({
  spinning: false,
  entity: {
    id:null as unknown as number,
    versin:null as unknown as number,
    enabled: 1,
    sources: [],
    resourceIds: [],
    removable: 1,
    modifiable: 1,
    parentId:null as unknown as number,
    name: "",
    authority: "",
    remark: ""
  },
  modifiableOptions:[],
  enabledOptions:[],
  removableOptions:[],
  sourceOptions:[],
  parentOptions:[],
  query:{'filter_[enabled_eq]':'1', 'filter_[sources_jin]':[]}
})

const resourceTableRef = ref<InstanceType<typeof LResourceTable>>()

async function mounted() {
  options.value.spinning = true

  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"YesOrNo"}, {"id":"ResourceSourceEnum"}]})
  if (enums.data) {
    options.value.modifiableOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.removableOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.sourceOptions = enums.data['resource-server']?.ResourceSourceEnum as NameValueEnumMetadata<string>[]
  }

  const query:FilterRequest = {};
  if (globalProperties.$route.query.id) {
    query["filter_[id_ne]"] = globalProperties.$route.query.id;
  }
  const result:RestResult<RoleEntity[]> = await service.find(query)
  options.value.parentOptions = result?.data || [];
  options.value.spinning = false
}

function sourceChange(value: string, _options: OptionProps[]) {
  if (_options.length <= 0) {
    resourceTableRef.value?.clearDataSource()
    return;
  }
  options.value.query['filter_[sources_jin]'] = _options.map((o: OptionProps) => o.value);
  resourceTableRef.value?.fetchDataSource()
}

function setPageTitle(title:string, entity: RoleEntity) {
  return title + ' (' + entity.name + ')'
}

function postGet(result: RestResult<RoleEntity>, _entity: RoleSavePayload) {
  options.value.query['filter_[sources_jin]'] = _entity.sources.map(getEnumValue);
  resourceTableRef.value?.fetchDataSource()
}

function resetFields() {
  options.value.entity.resourceIds = []
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-basic-form @resetFields="resetFields" @post-get="postGet" :title-text="setPageTitle" :redirect="{name:'auth_server_role'}" :service="service" v-model:entity="options.entity" :spinning="options.spinning">
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="name" :label="globalProperties.$t('common.name')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="authority" :label="globalProperties.$t('authServer.authority')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.authority" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="sources" :label="globalProperties.$t('authServer.source')" :rules="[{required: true, trigger: 'change', type: 'array'}]">
            <a-select mode="multiple" v-model:value="options.entity.sources" :options="options.sourceOptions" :field-names="{label:'name'}" @change="sourceChange" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="removable" :label="globalProperties.$t('authServer.role.removable')">
            <a-select v-model:value="options.entity.removable" :options="options.removableOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="modifiable" :label="globalProperties.$t('authServer.role.modifiable')">
            <a-select v-model:value="options.entity.modifiable" :options="options.modifiableOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="enabled" :label="globalProperties.$t('common.enabled')">
            <a-select v-model:value="options.entity.enabled" :options="options.enabledOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
      </template>

      <a-form-item v-if="options.parentOptions.length > 0" name="parentId" :label="globalProperties.$t('common.parent')">
        <a-select v-model:value="options.entity.parentId" :options="options.parentOptions" :field-names="{label:'name'}" />
      </a-form-item>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="icon-template-success" />
          {{ globalProperties.$t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <l-resource-table
        ref="resourceTableRef"
        :immediate="false"
        :preview="true"
        root-class="mb-md"
        :query="options.query"
        :row-selection="{type: 'checkbox', selectedRowKeys: options.entity.resourceIds, onChange: (_keys) => options.entity.resourceIds = _keys as number[]}"
      />

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
