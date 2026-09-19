<script setup lang="ts">

import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import {AttachmentUpload as LAttachmentUpload} from '@loncra/antdv-pro'
import type {EmailMessageEntity} from "@loncra/client/message";
import {EmailMessageService, MESSAGE_SERVER_MESSAGE_TYPE_VALUE} from "@loncra/client/message";
import {MESSAGE_SERVER_EMAIL_ROUTE, OPERATION_DATA_TRACE_TABLE} from '@/constants';
import {getEnumName} from "@loncra/client/commons"

defineOptions({
  name: 'MessageServerEmailDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EmailMessageService()
const entity = ref<EmailMessageEntity>({
  attachmentList: [],
  batchId: 0,
  content: "",
  id: 0,
  remark: "",
  fromEmail:"",
  title: "",
  toEmail: "",
  type: MESSAGE_SERVER_MESSAGE_TYPE_VALUE.NOTICE,
  version: 0
})

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.EMAIL_MESSAGE"
      :redirect="{name:MESSAGE_SERVER_EMAIL_ROUTE.HOME}"
      :title-text="(title:string, _entity:EmailMessageEntity) => title + ' (' + _entity.id + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 1,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">
        {{ dateTimeFormat(entity.creationTime) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('messageServer.email.fromEmail')">
        {{ getEnumName(entity.fromEmail) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('messageServer.email.receiveEmail')">
        {{ entity.toEmail }}
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
      <a-descriptions-item :span="2" :label="globalProperties.$t('common.title')">
        {{ entity.title }}
      </a-descriptions-item>
      <a-descriptions-item :span="2" :label="globalProperties.$t('common.content')">
        <div v-html="entity.content"></div>
      </a-descriptions-item>
      <a-descriptions-item :span="2" :label="globalProperties.$t('attachment.text')">
        <l-attachment-upload preview mode="dragger" :value="entity.attachmentList"/>
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
