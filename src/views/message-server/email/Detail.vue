<script setup lang="ts">

import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from "@/utils";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import {EmailMessageService} from "@/apis/message-server/emailMessageService.ts";
import type {EmailMessageEntity} from "@/types/apis/message-server/emailDomain.ts";

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
  type: 10,
  version: 0
})

</script>

<template>
  <div>
    <l-basic-detail
      operation-data-trace-target="tb_email_message"
      :redirect="{name:'message_server_email'}"
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
