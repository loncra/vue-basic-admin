<script setup lang="ts">
import {useRouter} from 'vue-router'
import type {RestResult} from '@loncra/client/commons'
import {CrudFormPage} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_EMAIL_ROUTE} from '@/constants'
import {navigateAfterMessageSend} from '@/composables/message-server/useMessageSendFlow'
import {emailSendFormPage} from './email.send.page'

/**
 * 邮件发送页：**只剩壳** —— 字段 / 校验 / 提交（`send`）全在 `email.send.page.ts`。
 *
 * 它还管两件"宿主环境"的事（pro 不认）：
 * ① **按钮区**：只把「保存」换成「发送」（旧版文案 + 自己的图标字体）；**「重置」用壳给的那颗**
 *    （`resetButton` 就是渲染函数 ⇒ `<component :is="resetButton" />`，行为与壳上那颗一模一样：
 *    antd `resetFields` + 声明的 `onReset` + `emit('resetFields')`）；
 * ② **发送成功去哪**：`navigateAfterMessageSend` 认单条 / 批量两种返回形状。成功提示不用管 ——
 *    壳会照 `result.message` 给（与旧页面那句 `message.success` 一字不差）。
 */
defineOptions({
  name: 'MessageServerEmailSend',
})

const router = useRouter()

/** 列表 / 批次明细由返回值形状决定（旧 `doSubmit` 里那一步） */
function onSuccess(result: RestResult<unknown>) {
  navigateAfterMessageSend(router, result.data, MESSAGE_SERVER_EMAIL_ROUTE.HOME)
}
</script>

<template>
  <crud-form-page :page="emailSendFormPage" @success="onSuccess">
    <!-- 旧版按钮上方那条分割线（字段之后、按钮之前正好是 default 槽） -->
    <a-divider />

    <template #buttons="{loading, resetButton}">
      <a-button type="primary" html-type="submit" :loading="loading">
        <template #icon>
          <icon-font class="icon" type="loncra-send" />
        </template>
        <span>{{ $t('common.send') }}</span>
      </a-button>

      <!-- 「重置」直接用壳那颗（图标/文案/逻辑都是 pro 的标准实现，不再抄一遍） -->
      <component :is="resetButton" />
    </template>
  </crud-form-page>
</template>
