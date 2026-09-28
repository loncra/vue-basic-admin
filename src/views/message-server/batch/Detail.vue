<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {BatchMessageEntity} from "@loncra/client/message";
import {
  BatchMessageService,
  MESSAGE_SERVER_MESSAGE_TYPE_VALUE,
  SiteMessageService
} from "@loncra/client/message";
import type {RestResult} from "@loncra/client/commons";
import {CrudHomePage} from '@loncra/antdv-pro'
import {smsHomePage} from '@/views/message-server/sms/sms.home.page'
import {siteHomePage} from '@/views/message-server/site/site.home.page'
import {emailHomePage} from '@/views/message-server/email/email.home.page'

import {MESSAGE_SERVER_BATCH_ROUTE} from '@/constants';
import {getEnumName, getEnumValue} from "@loncra/client/commons"

import {useDateFormat} from '@loncra/antdv-pro'

const {dateTimeFormat} = useDateFormat()

defineOptions({
  name: 'MessageServerBatchDetail'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
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
  type: MESSAGE_SERVER_MESSAGE_TYPE_VALUE.NOTICE,
  version: 0
})

const readCount = ref<number>(0)

async function postGetEntity(entity:BatchMessageEntity){
  const result:RestResult<number> = await siteService.countRead(Number(entity.id));
  readCount.value = result?.data || 0
  return entity
}

</script>

<template>
  <div>
    <l-basic-detail
      :post-get-entity="postGetEntity"
      :redirect="{name:MESSAGE_SERVER_BATCH_ROUTE.HOME}"
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
      <!--
        子表：按批次类型显示短信 / 站内信 / 邮件消息（旧的三张表已由 pro 的列表声明取代）。
        旧组件 `preview` 的等价物 = 不要标题 + 不要行内动作 + 不要多选，再用 `plain` 去掉卡片边框与内边距。
      -->
      <template #afterDescriptions v-if="Number(entity.id) > 0">
        <crud-home-page
          v-if="getEnumValue(entity.type) === 30"
          class="mt-lg"
          :page="smsHomePage"
          :query="{'filter_[batch_id_eq]':entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
        <crud-home-page
          v-else-if="getEnumValue(entity.type) === 10"
          class="mt-lg"
          :page="siteHomePage"
          :query="{'filter_[batch_id_eq]':entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
        <crud-home-page
          v-else-if="getEnumValue(entity.type) === 20"
          class="mt-lg"
          :page="emailHomePage"
          :query="{'filter_[batch_id_eq]':entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
      </template>
    </l-basic-detail>
  </div>
</template>
