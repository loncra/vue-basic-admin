<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {dateTimeFormat, getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, inject, ref} from "vue";
import {BatchMessageService} from "@/apis/message-server/batchMessageService.js";
import type {BatchMessageEntity} from "@/types/apis/message-server/batchDomain.ts";
import LSmsTable from "@/components/message-server/SmsTable.vue";
import LSiteTable from "@/components/message-server/SiteTable.vue";
import LEmailTable from "@/components/message-server/EmailTable.vue";
import {APP_RELOAD_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import {SiteMessageService} from "@/apis/message-server";
import type {RestResult} from "@/types/apis";

defineOptions({
  name: 'MessageServerBatchDetail'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const reload = inject<Function>(APP_RELOAD_PROVIDE_KEY)
const service = new BatchMessageService()
const siteService = new SiteMessageService()
const entity = ref<BatchMessageEntity>({
  completeTime: 0,
  count: 0,
  sendingNumber:0,
  executeStatus: -1,
  failNumber: 0,
  id: 0,
  successNumber: 0,
  type: 10,
  version: 0
})

const readCount = ref<number>(0)

async function postGetEntity(entity:BatchMessageEntity){
  const result:RestResult<number> = await siteService.countRead(entity.id);
  readCount.value = result?.data || 0
}

</script>

<template>
  <div>
    <l-basic-detail
      :post-get-entity="postGetEntity"
      :redirect="{name:'message_server_batch'}"
      :title-text="(title:string, _entity:BatchMessageEntity) => title + ' (' + _entity.id + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{ getEnumName(entity.executeStatus) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">{{ dateTimeFormat(entity.creationTime) }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.completionTime')">{{ dateTimeFormat(entity.completeTime) }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('messageServer.batch.count')">
        <a-space>
          <span>
            {{ entity.count }}
          </span>
          <span>
            (
            <a-typography-text type="success">{{globalProperties.$t('messageServer.batch.successNumber', {count:':' + entity.successNumber})}}</a-typography-text>,
            <a-typography-text type="danger">{{ globalProperties.$t('messageServer.batch.failNumber', {count:':' + entity.failNumber}) }}</a-typography-text>
            )
          </span>

          <template v-if="getEnumValue(entity.type) === 10">
            {{globalProperties.$t('messageServer.site.readCount',{count: ':' + readCount})}}
          </template>
        </a-space>
      </a-descriptions-item>
      <template #afterDescriptions v-if="entity.id > 0">
        <l-sms-table v-if="getEnumValue(entity.type) === 30" class="mt-lg" :query="{'filter_[batch_id_eq]':entity.id}" preview/>
        <l-site-table v-else-if="getEnumValue(entity.type) === 10" class="mt-lg" :query="{'filter_[batch_id_eq]':entity.id}" preview/>
        <l-email-table v-else-if="getEnumValue(entity.type) === 20" class="mt-lg" :query="{'filter_[batch_id_eq]':entity.id}" preview/>
      </template>
      <template #extra>
        <a-button size="small" @click="reload?.()">
          <icon-font class="icon" type="icon-change" />
        </a-button>
      </template>
    </l-basic-detail>
  </div>
</template>
