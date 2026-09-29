<script setup lang="ts">
import type {IdNameValueMetadata, RestResult} from '@loncra/client/commons'
import {getEnumValue} from '@loncra/client/commons'
import type {SmsSignEntity, SmsTemplateEntity} from '@loncra/client/message'
import {SmsSignService, SmsTemplateService} from '@loncra/client/message'
import {CrudFormPage, type CrudFormPageExpose, type SearchableColumnType,} from '@loncra/antdv-pro'
import {computed, onMounted, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import i18n from '@/i18n'
import {MESSAGE_SERVER_SMS_ROUTE} from '@/constants'
import {navigateAfterMessageSend} from '@/composables/message-server/useMessageSendFlow'
import {type SmsSendForm, smsSendFormPage} from './sms.send.page'

defineOptions({
  // 与旧页同名：tab / keep-alive / 路由缓存认这个名字
  name: 'MessageServerSmsForm',
})

const router = useRouter()

const formRef = ref<CrudFormPageExpose<SmsSendForm>>()

/** 按渠道取的两份业务选项（声明侧从 `:context-extra` 读，见 `sms.send.page.ts`） */
const smsTemplates = ref<SmsTemplateEntity[]>([])
const smsSigns = ref<SmsSignEntity[]>([])

/** 拉模板详情期间转圈（旧页 `options.spinning`） */
const spinning = ref(false)

/** 模板原文：变量替换每次都从它重算（= 旧页的 `currentTemplateContent`，行为照搬） */
const templateContent = ref('')

/**
 * 首屏按**当前渠道**拉两份业务选项（= 旧 `mounted()`）。
 *
 * ⚠️ **现状照搬**：旧页只在挂载时拉一次 ⇒ 切换渠道**不会**重拉这份列表。要改成跟随渠道，
 * 在这里加 `watch(() => formRef.value?.entity.channel, …)` 即可（本轮没做，属既有行为）。
 */
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

/**
 * 选模板 ⇒ 拉模板详情，铺变量行与内容（= 旧 `onTemplateCodeChange`）。
 *
 * 变量行来自模板的 `variableAttribute`（一个 `{变量名: 说明}` 的 JSON 串）；内容取
 * `templateContent` 存进实体，原文另存 `templateContent` 供"改变量重算内容"用。
 */
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
    // 旧页直接 `JSON.parse(String(... || ''))`（没有变量属性时会抛）⇒ 这里补空值判断，其余照搬
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

// 只看声明字段的值（重置后 `templateCode` 回到初值空串 ⇒ 不重复拉）
watch(
  () => formRef.value?.entity.metadata.templateCode,
  (code) => {
    if (code) {
      void onTemplateChange(code)
    }
  },
)

/**
 * 改变量 ⇒ 重算内容（= 旧 `variableValueChange`）。
 *
 * ⚠️ 与旧页一字不差：每次都从**模板原文**替换这一个变量 ⇒ 先改 A 再改 B，A 的替换会被抹掉。
 * 这是既有行为，本次不擅自动（要修是另一件事）。
 */
function variableValueChange(record: IdNameValueMetadata<string>): void {
  const entity = formRef.value?.entity
  if (entity) {
    entity.content = templateContent.value.replace('${' + record.id + '}', record.value)
  }
}

/** 变量表列（旧页 `variableTableColumns`，label 改走 computed 以跟随语言切换） */
const variableTableColumns = computed<SearchableColumnType[]>(() => [
  {title: i18n.global.t('common.name'), dataIndex: 'id', key: 'id'},
  {title: i18n.global.t('common.type'), dataIndex: 'name', key: 'name'},
  {title: i18n.global.t('common.value'), dataIndex: 'value', key: 'value'},
])

/** 发送成功去哪：列表 / 批次明细由返回值形状决定（旧 `doSubmit` 里那一步） */
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

      <!-- 旧版按钮上方那条分割线 -->
      <a-divider />
    </template>

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
