<script setup lang="ts">
import {getCurrentInstance} from 'vue'
import type {RestResult} from '@loncra/client/commons'
import {CrudFormPage} from '@loncra/antdv-pro'
import {MESSAGE_SERVER_SITE_ROUTE} from '@/constants'
import {navigateAfterMessageSend} from './navigateAfterMessageSend.ts'
import {siteSendFormPage} from './site.send.page'

defineOptions({
  name: 'MessageServerSiteSend',
})

const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const router = globalProperties.$router

function onSuccess(result: RestResult<unknown>): void {
  navigateAfterMessageSend(router, result.data, MESSAGE_SERVER_SITE_ROUTE.HOME)
}
</script>

<template>
  <crud-form-page :page="siteSendFormPage" @success="onSuccess">
    <a-divider />

    <template #buttons="{loading, resetButton}">
      <a-button type="primary" html-type="submit" :loading="loading">
        <template #icon>
          <icon-font class="icon" type="loncra-send" />
        </template>
        <span>{{ $t('common.send') }}</span>
      </a-button>

      <component :is="resetButton" />
    </template>
  </crud-form-page>
</template>
