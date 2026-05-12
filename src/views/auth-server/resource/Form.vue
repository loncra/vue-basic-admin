<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {NameValueEnumMetadata, ResourceEntity, ResourceSavePayload, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ResourceServerService, ResourceService} from "@/apis";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import type {FilterRequest} from "@/types/common.ts";

defineOptions({
  name: 'LAuthServerConsoleUserForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new ResourceService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:ResourceSavePayload
  enabledOptions:NameValueEnumMetadata<number>[]
  typeOptions:NameValueEnumMetadata<string>[]
  categoryOptions:NameValueEnumMetadata<number>[]
  sourceOptions:NameValueEnumMetadata<string>[]
  parentOptions:ResourceEntity[]
  query:FilterRequest
  spinning:boolean
}>({
  spinning: false,
  entity: {
    sort: 0,
    enabled:1,
    authority: "",
    type: "",
    sources: [],
    name: "",
    icon: "",
    applicationName: "",
    page: "",
    id: null as unknown as number,
    versin: null as unknown as number,
    category: 20
  },
  typeOptions:[],
  categoryOptions:[],
  enabledOptions:[],
  sourceOptions:[],
  parentOptions:[],
  query:{}
})

async function mounted() {
  options.value.spinning = true

  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ResourceSourceEnum"},{"id":"YesOrNo"}],"auth-server":[{"id":"ResourceTypeEnum"},{"id":'ResourceCategoryEnum'}]})
  if (enums.data) {
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.sourceOptions = enums.data['resource-server']?.ResourceSourceEnum as NameValueEnumMetadata<string>[]
    options.value.categoryOptions = enums.data['auth-server']?.ResourceCategoryEnum as NameValueEnumMetadata<number>[]
    options.value.typeOptions = enums.data['auth-server']?.ResourceTypeEnum as NameValueEnumMetadata<string>[]
  }

  const query:FilterRequest = {};
  if (globalProperties.$route.query.id) {
    options.value.query["filter_[id_ne]"] = globalProperties.$route.query.id;
  }
  const result:RestResult<ResourceEntity[]> = await service.find(query)
  options.value.parentOptions = result?.data || [];
  options.value.spinning = false
}

function setPageTitle(title:string, entity: ResourceEntity) {
  return title + ' (' + entity.name + ')'
}

onMounted(mounted)
</script>

<template>
  <div>
    <l-basic-form :title-text="setPageTitle" :redirect="{name:'auth_server_resource'}" :service="service" v-model:entity="options.entity" :spinning="options.spinning">
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
            <a-select mode="multiple" v-model:value="options.entity.sources" :options="options.sourceOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="type" :label="globalProperties.$t('common.type')">
            <a-select v-model:value="options.entity.type" :options="options.typeOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="modifiable" :label="globalProperties.$t('common.type')">
            <a-select v-model:value="options.entity.category" :options="options.categoryOptions" :field-names="{label:'name'}" />
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

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
