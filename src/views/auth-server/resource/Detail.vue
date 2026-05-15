<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {getEnumName, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {ResourceService} from "@/apis";
import type {ResourceEntity} from "@/types";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new ResourceService()
const entity = ref<ResourceEntity>({
  applicationName: "",
  authority: "",
  category: 20,
  enabled: 0,
  icon: "",
  id: 0,
  key: "",
  name: "",
  page: "",
  sort: 0,
  sources: [],
  type: "",
  version: ""
})

</script>

<template>
  <div>
    <l-basic-detail
      operationDataTraceTarget="tb_resource"
      :redirect="{name:'auth_server_resource'}"
      :title-text="(title:string, _entity:ResourceEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}" v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        <a-space>
          <icon-font class="icon" :type="entity.icon || 'icon-survey'"/>
          {{entity.name}}
        </a-space>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.authority')">
        {{entity.authority}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.resource.page')">
        {{getEnumName(entity.page)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.source')">
        {{ entity.sources.map(getEnumName).join(',') }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.category')">
        {{ getEnumName(entity.category)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{ getEnumName(entity.enabled)}}
      </a-descriptions-item>

      <a-descriptions-item :label="globalProperties.$t('common.remark')">
        {{ entity.remark || '' }}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
