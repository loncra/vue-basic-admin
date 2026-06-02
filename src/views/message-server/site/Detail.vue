<script setup lang="ts">

import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {SiteMessageService} from "@/apis/message-server";
import type {SiteMessageEntity} from "@/types/apis/message-server/siteDomain.ts";
import {dateTimeFormat, getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineOptions({
  name: 'MessageServerSiteDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new SiteMessageService()
const entity = ref<SiteMessageEntity>({
  attachmentList: [],
  batchId: 0,
  channels: [],
  content: "",
  id: 0,
  pushable: 0,
  readTime: 0,
  readable: 0,
  remark: "",
  title: "",
  toUser: "",
  type: 10,
  version: 0
})

</script>

<template>
  <div>
    <l-basic-detail
      operation-data-trace-target="tb_site_message"
      :redirect="{name:'message_server_site'}"
      :title-text="(title:string, _entity:SiteMessageEntity) => title + ' (' + _entity.id + ')'"
      :service="service"
      :column="{xxxl: 3,xxl: 3,xl: 3,lg: 1,md: 1,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">
        {{ dateTimeFormat(entity.creationTime) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('messageServer.site.pushable')">
        {{getEnumName(entity.pushable)}}
        <template v-if="getEnumValue(entity.pushable) === 1">
          ({{ entity.channels.map(v => getEnumName(v)).join(', ') }})
        </template>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('auth.principal')">
        {{ entity.toUser }}
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
      <a-descriptions-item :label="globalProperties.$t('common.readTime')">
        {{ dateTimeFormat(entity.readTime) }}
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('error.errorMessage')">
        {{ entity.exception }}
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('common.remark')">
        {{ entity.remark }}
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('common.cover')">
        <l-attachment-upload
          mode="picture-card"
          accept=".jpg,.jpeg,.png"
          preview
          :classes="{
                item:'w-[425px] h-[225px]',
                list:'w-full justify-center',
                meta:'w-[425px] mt-xxs max-w-full min-w-0'
              }"
          :max-count="1"
          :multiple="false"
          v-model:value="entity.cover"
        />
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('common.title')">
        {{ entity.title }}
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('common.content')">
        <div v-html="entity.content"></div>
      </a-descriptions-item>
      <a-descriptions-item :span="3" :label="globalProperties.$t('attachment.text')">
        <l-attachment-upload preview mode="dragger" :value="entity.attachmentList"/>
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
