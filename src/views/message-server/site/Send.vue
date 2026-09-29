<script setup lang="ts">
import type {RestResult} from '@loncra/client/commons'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useRouter} from 'vue-router'
import {MESSAGE_SERVER_SITE_ROUTE} from '@/constants'
import {navigateAfterMessageSend} from '@/composables/message-server/useMessageSendFlow'
import {siteSendFormPage} from './site.send.page'

defineOptions({
  // 与旧页同名：tab / keep-alive / 路由缓存认这个名字
  name: 'MessageServerSiteSend',
})

const router = useRouter()

/**
 * 站内信发送页：**只剩壳** —— 字段 / 校验 / 提交 / 来源（枚举桶）全在 `site.send.page.ts`。
 *
 * 来源只有一处：声明里写 `enumRef`，pro 统一收清单拉一次（`collectFormSources` + `loadSources`）；
 * 渠道那个**复合控件**是 `render` 逃生字段，它从字段级 ctx 的 `ctx.buckets` 取同一份结果
 * ⇒ 壳里**不需要**再拉一次（那是同一份桶两处请求）。
 *
 * 发送成功去哪：`navigateAfterMessageSend` 认单条 / 批量两种返回形状（旧页 `doSubmit` 里那行）。
 * 成功提示不用管 —— 壳会照 `result.message` 给（与旧页那句 `message.success` 一致）。
 */
function onSuccess(result: RestResult<unknown>): void {
  navigateAfterMessageSend(router, result.data, MESSAGE_SERVER_SITE_ROUTE.HOME)
}
</script>

<template>
  <crud-form-page :page="siteSendFormPage" @success="onSuccess">
    <!-- 旧版按钮上方那条分割线 -->
    <a-divider />

    <template #buttons="{loading, resetButton}">
      <a-button type="primary" html-type="submit" :loading="loading">
        <template #icon>
          <icon-font class="icon" type="loncra-send" />
        </template>
        <span>{{ $t('common.send') }}</span>
      </a-button>

      <!-- 「重置」直接用壳那颗（图标 / 文案 / 逻辑都是 pro 的标准实现） -->
      <component :is="resetButton" />
    </template>
  </crud-form-page>
</template>
