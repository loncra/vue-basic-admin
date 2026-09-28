<script setup lang="ts">
import {onMounted, ref} from 'vue'
import {ResourceServerService} from '@/apis'
import type {ModelGenerateOptions, ModelSettingEntity} from '@loncra/client/ai'
import type {NameValueEnumMetadata, RestResult} from '@loncra/client/commons'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
// ⚠️ 必须显式 import：宿主 `src/components` 下的旧 kit 渲染器被 unplugin-vue-components
// 自动注册成了**全局** `CrudDetailPage` ⇒ 漏 import 不报错、静默跑旧 kit（2026-09-28 踩过）
import {CrudDetailPage} from '@loncra/antdv-pro'
import {booleanToYesOrNo} from '@/utils'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {
  AI_SERVER_MODEL_SETTING_ROUTE,
  MODEL_DEFAULT_OPTIONS_KEY,
  MODEL_GENERATE_OPTION_BOOLEAN_KEYS,
  MODEL_GENERATE_OPTION_KEYS,
  MODEL_SETTING_MANUFACTURER_CODE_QUERY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {modelSettingDetailPage} from './model-setting.detail.page'

/**
 * 模型设置详情页薄壳：字段、标签、枚举显示、跨列数、操作记录都在声明
 * （`model-setting.detail.page.ts` / `model-setting.page.ts`）；这里只剩四件宿主的事 ——
 * 主键（pro 不认路由）、标题、离场，外加「默认参数」那张附表（值要过是/否枚举才显示得出来）。
 */
defineOptions({
  name: 'AiServerModelSettingDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: ModelSettingEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (模型名)` */
useEntityPageTitle(() => detailRef.value?.entity?.name)

/**
 * 记录被删 ⇒ 回列表 + 关 tab。⚠️ 回列表要**带上厂商 code**（列表左侧树靠它选中厂商，
 * 旧 `Detail.vue` 的 `redirect` 就是这么算的）⇒ 用函数形态（离场那一刻才求值）。
 */
const {onStale} = usePageExit({
  redirect: () => {
    const code = detailRef.value?.entity?.manufacturer?.code
    return {
      name: AI_SERVER_MODEL_SETTING_ROUTE.HOME,
      query: code ? {[MODEL_SETTING_MANUFACTURER_CODE_QUERY]: code} : {},
    }
  },
})

/** 是/否枚举：附表里布尔型参数要显示成「是/否」（照抄旧页面的 `onMounted`） */
const yesOrNoOptions = ref<NameValueEnumMetadata<number>[]>([])
onMounted(async () => {
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [{id: SYSTEM_ENUM_TYPE.YES_OR_NO}],
    })
  if (enums.data) {
    yesOrNoOptions.value = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
      SYSTEM_ENUM_TYPE.YES_OR_NO
    ] as NameValueEnumMetadata<number>[]
  }
})

/**
 * 默认参数的一项（照抄旧页面的 `optionDisplay`）：布尔型翻 Enum 显示名，其余原样。
 * 入参是插槽给的实体 ⇒ 在边界收窄一次。
 */
function optionDisplay(entity: unknown, key: (typeof MODEL_GENERATE_OPTION_KEYS)[number]): string {
  const record = (entity ?? {}) as ModelSettingEntity
  const raw = record.metadata?.[MODEL_DEFAULT_OPTIONS_KEY]
  const options = (raw && typeof raw === 'object' ? raw : {}) as ModelGenerateOptions
  const value = options[key]
  if (value === null || value === undefined || value === '') {
    return ''
  }
  if ((MODEL_GENERATE_OPTION_BOOLEAN_KEYS as readonly string[]).includes(key)) {
    const yn = booleanToYesOrNo(value)
    const matched = yesOrNoOptions.value.find((item) => getEnumValue(item) === yn)
    return matched ? getEnumName(matched) : String(yn)
  }
  return String(value)
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="modelSettingDetailPage"
    @stale="onStale"
  >
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.modelSetting.defaultOptions') }}
        </a-space>
      </a-divider>
      <a-descriptions
        bordered
        :layout="configProviderStore.antdv.state.detailLayout"
        :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}"
      >
        <a-descriptions-item
          v-for="key in MODEL_GENERATE_OPTION_KEYS"
          :key="key"
          :label="$t(`aiServer.modelSetting.options.${key}.label`)"
        >
          {{ optionDisplay(entity, key) }}
        </a-descriptions-item>
      </a-descriptions>
    </template>
  </crud-detail-page>
</template>
