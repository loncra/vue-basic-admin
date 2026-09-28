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

/**
 * 批量消息详情页薄壳：字段、标签、枚举显示、`count` 的拼装、已读数都在声明
 * （`batch.detail.page.ts` / `batch.page.ts`）；
 * 这里剩四件宿主的事 —— 主键（pro 不认路由）、标题、离场，以及 descriptions 之后那三张子表。
 */
defineOptions({
  name: 'MessageServerBatchDetail',
})

const detailRef = ref<{entity?: BatchMessageEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (id)` */
useEntityPageTitle(() => {
  const entityId = detailRef.value?.entity?.id
  return entityId == null ? undefined : String(entityId)
})

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
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
      <!-- 实体到位（新增/编辑中还没 id）才挂子表 -->
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
