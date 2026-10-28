<script setup lang="ts">
import type {IdNameValueMetadata, RestResult} from '@loncra/client/commons'
import {getEnumValue} from '@loncra/client/commons'
import type {SmsSignEntity, SmsTemplateEntity} from '@loncra/client/message'
import {SmsSignService, SmsTemplateService} from '@loncra/client/message'
import {CrudFormPage, type CrudFormPageExpose, type SearchableColumnType,} from '@loncra/antdv-pro'
import {computed, getCurrentInstance, onMounted, ref, watch} from 'vue'
import i18n from '@/i18n'
import {MESSAGE_SERVER_SMS_ROUTE} from '@/constants'
import {navigateAfterMessageSend} from './navigateAfterMessageSend.ts'
import {type SmsSendForm, smsSendFormPage} from './sms.send.page'

defineOptions({
  name: 'MessageServerSmsForm',
})

const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const router = globalProperties.$router

const formRef = ref<CrudFormPageExpose<SmsSendForm>>()

const smsTemplates = ref<SmsTemplateEntity[]>([])
const smsSigns = ref<SmsSignEntity[]>([])

const spinning = ref(false)

const templateContent = ref('')

async function loadChannelOptions(): Promise<void> {
  const channel = formRef.value?.entity.channel
  if (!channel) {
    return
  }
  const channelValue = String(getEnumValue(channel))
  const [templates, signs] = await Promise.all([
    new SmsTemplateService(channelValue).find(),
    new SmsSignService(channelValue).find(),
  ])
  smsTemplates.value = templates.data ?? []
  smsSigns.value = signs.data ?? []
}

onMounted(loadChannelOptions)

async function onTemplateChange(code: string): Promise<void> {
  const entity = formRef.value?.entity
  if (!entity) {
    return
  }
  try {
    spinning.value = true
    entity.metadata.variables = []
    entity.content = ''
    templateContent.value = ''
    const result = await new SmsTemplateService(String(getEnumValue(entity.channel))).getByCode(code)
    const raw = String(result.data?.variableAttribute || '')
    const variables = raw ? (JSON.parse(raw) as Record<string, string>) : null
    if (!variables) {
      return
    }
    entity.content = String(result.data?.templateContent || '')
    templateContent.value = entity.content
    for (const [key, label] of Object.entries(variables)) {
      entity.metadata.variables.push({id: key, name: label, value: ''})
    }
  } finally {
    spinning.value = false
  }
}

watch(
  () => formRef.value?.entity.metadata.templateCode,
  (code) => {
    if (code) {
      void onTemplateChange(code)
    }
  },
)

function variableValueChange(record: IdNameValueMetadata<string>): void {
  const entity = formRef.value?.entity
  if (entity) {
    entity.content = templateContent.value.replace('${' + record.id + '}', record.value)
  }
}

const variableTableColumns = computed<SearchableColumnType[]>(() => [
  {title: i18n.global.t('common.name'), dataIndex: 'id', key: 'id'},
  {title: i18n.global.t('common.type'), dataIndex: 'name', key: 'name'},
  {title: i18n.global.t('common.value'), dataIndex: 'value', key: 'value'},
])

function onSuccess(result: RestResult<unknown>): void {
  navigateAfterMessageSend(router, result.data, MESSAGE_SERVER_SMS_ROUTE.HOME)
}
</script>

<template>
  <crud-form-page
    ref="formRef"
    :page="smsSendFormPage"
    :context-extra="{smsTemplates, smsSigns}"
    @success="onSuccess"
  >
    <!--
      变量区（内容预览 + 变量表）：pro 没有"表格式字段"能力 ⇒ 按既定口径走**宿主自己的逃生**，
      画在壳的 `default` 槽里（位置正好是"字段行之后、按钮之前"，与旧页顺序一致）。
      旧页 markup 照搬，只有两点不同：`message-variables` 是旧 kit `LForm` 的 prop（新表单没有，
      已去掉）；表格标题栏文案照旧走 i18n。
    -->
    <template #default="{entity}">
      <a-spin v-if="entity.content" :spinning="spinning">
        <a-form-item :label="$t('common.content')" name="content">
          <a-textarea
            :value="(entity.metadata.signCode ? `【${entity.metadata.signCode}】` : '') + entity.content"
            disabled
            :auto-size="{minRows: 8, maxRows: 10}"
          />
        </a-form-item>

        <a-table
          v-if="entity.metadata.variables.length > 0"
          :pagination="false"
          bordered
          :data-source="entity.metadata.variables"
          :columns="variableTableColumns"
        >
          <template #title>
            {{ $t('messageServer.sms.variable.title') }}
          </template>
          <template #bodyCell="{index, column, record}">
            <template v-if="column.dataIndex === 'value'">
              <a-form-item
                class="m-0"
                :name="['metadata', 'variables', index, 'value']"
                :rules="[{required: true, trigger: 'change'}]"
              >
                <a-input v-model:value="record.value" @change="variableValueChange(record)" />
              </a-form-item>
            </template>
          </template>
        </a-table>
      </a-spin>

      <a-divider />
    </template>

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
