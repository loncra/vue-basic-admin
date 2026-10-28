<script setup lang="ts">
import {ref} from 'vue'
import type {BatchMessageEntity} from '@loncra/client/message'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import {getEnumValue} from '@loncra/client/commons'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {smsHomePage} from '@/views/message-server/sms/sms.home.page'
import {siteHomePage} from '@/views/message-server/site/site.home.page'
import {emailHomePage} from '@/views/message-server/email/email.home.page'
import {batchCore} from './batch.page'
import {BATCH_MESSAGE_TYPE, batchDetailPage} from './batch.detail.page'

defineOptions({
  name: 'MessageServerBatchDetail',
})

const detailRef = ref<{entity?: BatchMessageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

const {onStale} = usePageExit({redirect: batchCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="batchDetailPage"
    @stale="onStale"
  >
    <!--
      子表：按批次类型显示短信 / 站内信 / 邮件消息（三张都用已迁好的列表声明）。
      旧组件 `preview` 的等价物 = `:title="false"` + 不要行内动作 + 不要多选 + `plain`。
    -->
    <template #afterDescriptions="{entity}">
      <template v-if="Number(entity.id) > 0">
        <crud-home-page
          v-if="getEnumValue(entity.type) === BATCH_MESSAGE_TYPE.SMS"
          class="mt-lg"
          :page="smsHomePage"
          :query="{'filter_[batch_id_eq]': entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
        <crud-home-page
          v-else-if="getEnumValue(entity.type) === BATCH_MESSAGE_TYPE.SITE"
          class="mt-lg"
          :page="siteHomePage"
          :query="{'filter_[batch_id_eq]': entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
        <crud-home-page
          v-else-if="getEnumValue(entity.type) === BATCH_MESSAGE_TYPE.EMAIL"
          class="mt-lg"
          :page="emailHomePage"
          :query="{'filter_[batch_id_eq]': entity.id}"
          :title="false"
          :record-actions="false"
          :row-selection="false"
          plain
        />
      </template>
    </template>
  </crud-detail-page>
</template>
