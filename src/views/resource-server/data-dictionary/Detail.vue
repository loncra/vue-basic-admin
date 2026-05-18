<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {getEnumName, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {DataDictionaryEntity} from "@/types/apis/resource-server/dataDictionaryDomain.ts";
import {DataDictionaryService} from "@/apis/resource-server/dataDictionaryService.ts";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new DataDictionaryService()
const entity = ref<DataDictionaryEntity>({
  children: [],
  code: "",
  enabled: 0,
  id: 0,
  name: "",
  typeId: 0,
  value: "",
  valueType: 30,
  version: 0

})

</script>

<template>
  <div>
    <l-basic-detail
      operationDataTraceTarget="tb_data_dictionary"
      :redirect="{name:'resource_server_dictionary'}"
      :title-text="(title:string, _entity:DataDictionaryEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        {{entity.name}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('resourceServer.code')">
        {{entity.code}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('resourceServer.dataDictionary.valueType')">
        {{getEnumName(entity.valueType)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{ getEnumName(entity.enabled)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('resourceServer.dataDictionary.level')">
        {{entity.level}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.sort')">
        {{ entity.sort}}
      </a-descriptions-item>

      <a-descriptions-item :label="globalProperties.$t('common.value')" :span="2">
        {{ getEnumName(entity.value)}}
      </a-descriptions-item>

      <a-descriptions-item :label="globalProperties.$t('common.remark')" :span="2">
        {{ entity.remark || '' }}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
