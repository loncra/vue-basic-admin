<script setup lang="ts">

import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {SmsMessageService} from "@/apis/message-server";
import type {SmsMessageEntity} from "@/types/apis";

defineOptions({
  name: 'MessageServerEmailDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new SmsMessageService()
const entity = ref<SmsMessageEntity>({
  batchId: 0,
  channel: "",
  content: "",
  executeStatus: 10,
  id: 0,
  metadata: {},
  phoneNumber: "",
  principal: "",
  remark: "",
  type: 10,
  version: 0
})

</script>

<template>
  <div>
    <l-basic-detail
      operation-data-trace-target="tb_sms_message"
      :redirect="{name:'message_server_sms'}"
      :title-text="(title:string, _entity:SmsMessageEntity) => title + ' (' + _entity.id + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 1,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">
        {{ dateTimeFormat(entity.creationTime) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.channel')">
        {{ getEnumName(entity.channel) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.phoneNumber')">
        {{ entity.phoneNumber }}
        <template v-if="entity.metadata?.toPrincipal">
          ({{(entity.metadata?.toPrincipal as {name:string})?.name}})
        </template>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{ getEnumName(entity.executeStatus) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.retry.count')">
        {{ entity.retryCount }} / {{entity.maxRetryCount}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.retry.time')">
        {{ dateTimeFormat(entity.retryTime) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.successTime')">
        {{ dateTimeFormat(entity.successTime) }}
      </a-descriptions-item>
      <a-descriptions-item :span="2" :label="globalProperties.$t('error.errorMessage')">
        {{ entity.exception }}
      </a-descriptions-item>
      <a-descriptions-item :span="2" :label="globalProperties.$t('common.remark')">
        {{ entity.remark }}
      </a-descriptions-item>
      <a-descriptions-item :span="2" :label="globalProperties.$t('common.content')">
        {{entity.content}}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
