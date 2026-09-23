<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {NameValueEnumMetadata, RestResult} from "@loncra/client/commons";
import type {
  DataDictionaryEntity,
  DataDictionarySavePayload,
  DictionaryTypeEntity,
  EnumBucketsResponseBody
} from "@loncra/client/resource";
import {DataDictionaryService, DictionaryTypeService} from "@loncra/client/resource";
import {requireNonNullOrUndefined} from "@/utils";
import {
  OPERATION_DATA_TRACE_TABLE,
  RESOURCE_SERVER_DATA_DICTIONARY_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  VALUE_TYPE
} from '@/constants';
import LBasicForm from "@/components/basic/form/BasicForm.vue";
import {useRequiredQuery} from "@/composables/useRequiredQuery";
import {ResourceServerService} from "@/apis";

defineOptions({
  name: 'ResourceServerDataDictionaryForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

/**
 * 入口校验 + 取参：`id`（编辑）/ `parentId`（在某条下面新增）/ `typeId`（在某个类型下新增）
 * **至少给一个**，一个都没有才跳 400（`{anyOf: true}`）。
 * 参数不齐时模板的 `v-if="ok"` 让表单壳**根本不挂载**（旧代码是在 `preMounted` 里手写这段，
 * 还会晚一步、让表单先渲染出来）。值同样是**快照**（进页面那一刻取一次）。
 */
const {ok, parentId, typeId} = useRequiredQuery(['id', 'parentId', 'typeId'], {anyOf: true})

const service = new DataDictionaryService()
const typeService = new DictionaryTypeService()

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
    valueType: VALUE_TYPE.STRING,
    enabled: 1,
    typeId: null as unknown as number,
    parentId: null as unknown as number,
  },
  valueTypeOptions:[],
  enabledOptions:[],
})

async function preMounted() {

  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
      {id: SYSTEM_ENUM_TYPE.VALUE_TYPE_ENUM},
      {id: SYSTEM_ENUM_TYPE.YES_OR_NO}
    ]
  })
  if (enums.data) {
    options.value.valueTypeOptions = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.VALUE_TYPE_ENUM] as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] as NameValueEnumMetadata<number>[]
  }
  // 参数不齐（三者一个都没有）由 `useRequiredQuery` 处理（跳 400 + 关 tab，见文件顶部）；这里只按参数加载
  if (parentId) {
    const result:RestResult<DataDictionaryEntity> = await service.get(parentId)
    if (result.data) {
      options.value.parent = result.data
    }
  } else if (typeId) {
    const result:RestResult<DictionaryTypeEntity> = await typeService.get(typeId)
    if (result.data) {
      options.value.type = result.data
      options.value.entity.typeId = Number(result.data.id)
    }
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
    return title + ' (' + globalProperties.$t('resourceServer.dataDictionary.editPage',{typeName:options.value?.type?.name, dataName:options.value.entity.name}) + ')'
  }
  return title + '(' + options.value?.type?.name + ')'
}

</script>

<template>
  <div>
    <l-basic-form
      v-if="ok"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.DATA_DICTIONARY"
      :pre-mounted="preMounted"
      :post-mounted="postMounted"
      :title-text="setPageTitle"
      :redirect="{name:RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME, query:{typeId:options.entity.typeId}}"
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
          <a-form-item name="code" :label="globalProperties.$t('common.code')" :rules="[{required: true}]">
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
