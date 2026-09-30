<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils.ts'
import {
  ConfigProviderSetting as LConfigProviderSetting,
  DataLoadingCardPlan as LDataLoadingCardPlan
} from '@loncra/antdv-pro'
import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import LAccountSetting from "@/views/common/setting/AccountSetting.vue";
import LEnterpriseSetting from "@/views/common/setting/EnterpriseSetting.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {CREATE_SUCCESS_BACK, type CreateSuccessBackValue} from "@/constants";
import i18n, {type LanguagePack} from "@/i18n";
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'

defineOptions({
  name: 'CommonSetting'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const configProviderStore = useConfigProviderStore()

const tabList = computed(()=> {
  const result = [
    {
      key: 'accountSetting',
      tab: globalProperties.$t('systemSetting.tab.accountSetting'),
      icon:renderIconFont('loncra-user-round-cog', 'align')
    },
    {
      key: 'configProviderSetting',
      tab: globalProperties.$t('systemSetting.tab.configProviderSetting'),
      icon:renderIconFont('loncra-sliders-horizontal', 'align')
    },
  ]

  if (principalStore.state.type !== AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE) {
    result.push({
      key: 'enterpriseSetting',
      tab: globalProperties.$t('systemSetting.tab.enterpriseSetting'),
      icon:renderIconFont('loncra-building', 'align')
    })
  }

  return result
})

const activeTabKey = ref<string>('accountSetting')

/** pro 面板的语言下拉数据（来自宿主的 i18n；切换后 i18n / dayjs 由 `@/stores/configProviderStore` 同步） */
const localeOptions = computed(() =>
  Object.values(i18n.global.messages.value as Record<string, LanguagePack>)
    .filter((locale) => !!locale)
    .map((locale) => ({name: locale.name, value: locale.value})),
)

const createSuccessOptions = computed(() => [
  {name: globalProperties.$t('form.createSuccess.okReturnList'), value: CREATE_SUCCESS_BACK.HOME},
  {name: globalProperties.$t('form.createSuccess.addAnother'), value: CREATE_SUCCESS_BACK.CURRENT},
])

/**
 * 宿主自己的配置项（走面板的 `#extra` 插槽）：
 * 首页侧边栏的三项 + "创建记录成功后"的去向 —— 都是宿主的布局 / 业务偏好，归宿主 store。
 */
</script>

<template>
  <!--
    `w-fit`（`width: fit-content`）= **卡宽跟着内容走**（三个 tab 各自合适即可），`max-w-250`
    只做上限兜底。⚠️ 只写 `max-w-250` 是"块级 100% 再截断" ⇒ 卡会一直是 1000px，
    内层 `w-130` 只约束它自己那一段（看起来就"卡比内容宽、右边空一片"，2026-09-30 用户报）。
  -->
  <div class="mx-auto my-0 w-fit max-w-250">
    <l-data-loading-card-plan
      :tab-list="tabList"
      :title="false"
      :active-tab-key="activeTabKey"
      @tab-change="(key:string) => activeTabKey = key"
    >
      <template v-if="activeTabKey === 'accountSetting'">
        <l-account-setting />
      </template>
      <!--
        「系统设置」面板内部是**百分比布局**（`a-col` 12/24）⇒ 在外层 `w-fit` 下没有"内容固有宽度"
        会被压塌 ⇒ 给它一个**内容下限** `min-w-140`（35rem / 560px）：
        pro 面板的 token 输入框是**硬编码 `width: 420`**（`config-provider-setting/style/index.ts`
        的 `-token-input`）+ 行标签 `white-space: nowrap` ⇒ 560px 刚好不挤。
      -->
      <template v-if="activeTabKey === 'configProviderSetting'">
        <div class="min-w-140">
          <l-config-provider-setting :locales="localeOptions">
            <template #extra>
              <a-row :gutter="[configProviderStore.getToken().sizeMD]">
                <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
                  <a-form-item :label="globalProperties.$t('systemSetting.home.homeSiderWidth')">
                    <a-input-number
                      class="w-full"
                      :value="configProviderStore.state.homeSiderWidth"
                      @change="(value: number) => configProviderStore.setHomeSiderWidth(value)"
                    />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
                  <a-form-item :label="globalProperties.$t('systemSetting.home.homeCollapsedWidth')">
                    <a-space-compact block>
                      <a-input-number
                        class="w-full"
                        :value="configProviderStore.state.homeCollapsedWidth"
                        @change="(value: number) => configProviderStore.setHomeCollapsedWidth(value)"
                      />
                      <a-space-addon>
                        <a-switch
                          size="small"
                          :checked="configProviderStore.state.homeCollapsible"
                          :checked-children="globalProperties.$t('common.open')"
                          :un-checked-children="globalProperties.$t('common.close')"
                          @change="(value: boolean) => configProviderStore.setHomeCollapsible(value)"
                        />
                      </a-space-addon>
                    </a-space-compact>
                  </a-form-item>
                </a-col>
                <a-col :span="24">
                  <a-form-item :label="globalProperties.$t('systemSetting.createSuccessBack')">
                    <a-select
                      :value="configProviderStore.state.createSuccessBack"
                      :options="createSuccessOptions"
                      :field-names="{label: 'name'}"
                      @change="(value: string) => configProviderStore.setCreateSuccessBack(value as CreateSuccessBackValue)"
                    />
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
          </l-config-provider-setting>
        </div>
      </template>
      <template v-if="activeTabKey === 'enterpriseSetting'">
        <l-enterprise-setting />
      </template>
    </l-data-loading-card-plan>
  </div>
</template>
