<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, inject, ref} from "vue";
import type {
  NameValueEnumMetadata, 
  RestResult, 
  DataDictionaryEntity,
  DataDictionarySavePayload,
  DictionaryTypeEntity,
  EnumBucketsResponseBody
} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ResourceServerService} from "@/apis";
import {DataDictionaryService} from "@/apis/resource-server/dataDictionaryService.ts";;
import {DictionaryTypeService} from "@/apis/resource-server/dictionaryTypeService.ts";
import {LAYOUT_CONTENT_CLOSE_TAB_KEY} from "@/constants/systemConstant.ts";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const closeLayoutTab = inject<Function>(LAYOUT_CONTENT_CLOSE_TAB_KEY)

const service = new DataDictionaryService()
const typeService = new DictionaryTypeService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:DataDictionarySavePayload
  valueTypeOptions:NameValueEnumMetadata<number>[]
  enabledOptions:NameValueEnumMetadata<number>[]
  spinning:boolean
  type?:DictionaryTypeEntity
  parent?:DataDictionaryEntity
}>({
  spinning: false,
  entity: {
    id:null as unknown as number,
    version:null as unknown as number,
    code: "",
    name: "",
    value: "",
    valueType: 30,
    enabled: 1,
    typeId: null as unknown as number,
    parentId: null as unknown as number,
  },
  valueTypeOptions:[],
  enabledOptions:[],
})

async function preMounted() {

  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ValueTypeEnum"}, {"id":"YesOrNo"}]})
  if (enums.data) {
    options.value.valueTypeOptions = enums.data['resource-server']?.ValueTypeEnum as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
  }
  if (globalProperties.$route.query.parentId) {
    const result:RestResult<DataDictionaryEntity> = await service.get(globalProperties.$route.query.parentId as unknown as number)
    if (result.data) {
      options.value.parent = result.data
    }
  } else if (globalProperties.$route.query.typeId) {
    const result:RestResult<DictionaryTypeEntity> = await typeService.get(globalProperties.$route.query.typeId as unknown as number)
    if (result.data) {
      options.value.type = result.data
      options.value.entity.typeId = result.data.id
    }
  } else if (!globalProperties.$route.query.id) {
    const field = 'id  parentId  typeId'
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME, JSON.stringify([{code:"400", field:field, defaultMessage: globalProperties.$t('error.notNull')}]));
    globalProperties.$router.push({name:"400"});
    closeLayoutTab?.(globalProperties.$route.fullPath, false)
    return ;
  }
}

async function postMounted() {
  if (!options.value.entity.id) {
    return ;
  }

  const result:RestResult<DictionaryTypeEntity> = await typeService.get(options.value.entity.typeId)
  if (result.data) {
    options.value.type = result.data
    options.value.entity.code = options.value.entity.code.replace(options.value.type.code + ".", "")
  }
}

function setPageTitle(title:string, entity: DataDictionaryEntity | DataDictionarySavePayload) {
  if (options.value.parent) {
    return title + ' (' + options.value.parent.name + ')'
  } else if (entity.id) {
    return title + globalProperties.$t('resourceServer.dataDictionary.editPage',{typeName:options.value?.type?.name, dataName:options.value.entity.name})
  }
  return title
}

</script>

<template>
  <div>
    <l-basic-form
      operationDataTraceTarget="tb_data_dictionary"
      :pre-mounted="preMounted"
      :post-mounted="postMounted"
      :title-text="setPageTitle"
      :redirect="{name:'resource_server_dictionary', query:{typeId:options.entity.typeId}}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="name" :label="globalProperties.$t('common.name')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="code" :label="globalProperties.$t('resourceServer.code')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.code" >
              <template #prefix v-if="options.type">
                <a-typography-text strong="">{{options.type.code + '.'}}</a-typography-text>
              </template>
              <template #prefix v-else-if="options.parent">
                <a-typography-text strong="">{{options.parent?.code + '.'}}</a-typography-text>
              </template>
            </a-input>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="enabled" :label="globalProperties.$t('common.enabled')">
            <a-select v-model:value="options.entity.enabled" :options="options.enabledOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="valueType" :label="globalProperties.$t('resourceServer.dataDictionary.valueType')">
            <a-select v-model:value="options.entity.valueType" :options="options.valueTypeOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="level" :label="globalProperties.$t('resourceServer.dataDictionary.level')" >
            <a-input v-model:value="options.entity.level" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="sort" :label="globalProperties.$t('common.sort')" >
            <a-input-number class="w-full" v-model:value="options.entity.sort" />
          </a-form-item>
        </a-col>
      </template>

      <a-form-item name="value" :label="globalProperties.$t('common.value')" :rules="[{required: true}]">
        <a-textarea v-model:value="options.entity.value" :rows="4" show-count :maxlength="256" />
      </a-form-item>

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
