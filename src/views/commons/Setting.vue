<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LForm from "@/components/Form.vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import type {VNode} from "vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {CONFIG_PROVIDER_THEME} from "@/constants/systemConstant.ts";
import type {IdValueMetadata, NameValueEnumMetadata, ThemeMode} from "@/types";
import type {Color} from 'antdv-next'

defineOptions({
  name: 'LSetting',
})

const configProviderStore = useConfigProviderStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const options = ref<{
  themeOptions:NameValueEnumMetadata<string>[]
  tabItems: IdValueMetadata<string, VNode>[]
  colorOptions:string[]
}>({
  colorOptions: ['colorPrimary', 'colorError', 'colorSuccess', 'colorWarning'],
  tabItems:[
    {
      id: globalProperties.$t('setting.colorSetting.text'),
      value: createIcon('icon-user-defined', 'align')
    }
  ],
  themeOptions:[
    {
      name:globalProperties.$t('setting.theme.system'),
      value: CONFIG_PROVIDER_THEME.DARK
    },
    {
      name: globalProperties.$t('setting.theme.dark'),
      value: CONFIG_PROVIDER_THEME.DARK
    },
    {
      name: globalProperties.$t('setting.theme.light'),
      value: CONFIG_PROVIDER_THEME.LIGHT
    }
  ]
})

function colorChange(_color: Color, tokenKey: string): void {
  configProviderStore.setTokenValue(tokenKey, _color.toHexString())
}


</script>

<template>
  <div class="mx-auto my-0 w-150">
    <l-menu-title-card>
      <l-form>
        <a-row :gutter="[configProviderStore.getToken().marginMD]">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('setting.lang')">
              <a-select @change="(value: string) => configProviderStore.changeLocale(value)" :value="configProviderStore.state.locale" :options="configProviderStore.getLocales()" :field-names="{label:'name'}"></a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('setting.theme.text')">
              <a-select  @change="(value: string) => configProviderStore.setMode(value as ThemeMode)" :value="configProviderStore.state.theme"  :options="options.themeOptions" :field-names="{label:'name'}"></a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('setting.home.homeSiderWidth')">
              <a-input-number class="w-full" @change="(value: number) => configProviderStore.setHomeSiderWidth(value)" :value="configProviderStore.state.homeSiderWidth" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('setting.home.homeCollapsedWidth')">
              <a-space-compact block>
                <a-input-number class="w-full" @change="(value: number) => configProviderStore.setHomeCollapsedWidth(value)" :value="configProviderStore.state.homeCollapsedWidth" />
                <a-space-addon>
                  <a-switch size="small" :checked="configProviderStore.state.homeCollapsible" @change="(value: boolean) => configProviderStore.setHomeCollapsible(value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
                </a-space-addon>
              </a-space-compact>
            </a-form-item>
          </a-col>
        </a-row>

        <a-tabs centered :items="options.tabItems.map(item => ({key: item.id, label: item.id, icon: item.value}))">
          <template #contentRender="{item}">
            <template v-if="item.key === globalProperties.$t('setting.colorSetting.text')">
              <a-collapse :classes="{header: 'bg-container!'}">
                <a-collapse-panel :key="id" v-for="id of options.colorOptions">
                  <template #header>
                    {{globalProperties.$t('setting.colorSetting.' + id)}}
                  </template>
                  <template #extra>
                    <span @click.stop>
                      <a-color-picker size="small" @change="(color: Color) => colorChange(color, id)" :value="configProviderStore.getTokenValue(id)" />
                    </span>
                  </template>

                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.active.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.active.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Active')" size="large" :value="configProviderStore.getTokenValue(id + 'Active')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.bg.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.bg.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Bg')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Bg')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.bgHover.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.bgHover.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BgHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BgHover')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.border.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.border.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Border')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Border')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.borderHover.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.borderHover.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BorderHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BorderHover')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.hover.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.hover.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Hover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Hover')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.colorText.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.colorText.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Text')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Text')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center" class="mb-md">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.colorTextActive.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.colorTextActive.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'TextActive')" size="large" :default-value="configProviderStore.getTokenValue(id + 'TextActive')" />
                  </a-flex>
                  <a-flex justify="space-between" align="center">
                    <a-flex vertical :gap="2">
                      <a-typography-text strong>
                        {{ globalProperties.$t('setting.colorSetting.colorTextHover.title') }}
                      </a-typography-text>
                      <a-typography-text type="secondary">
                        {{ globalProperties.$t('setting.colorSetting.colorTextHover.subTitle') }}
                      </a-typography-text>
                    </a-flex>
                    <a-color-picker  @change="(color: Color) => colorChange(color, id + 'TextHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'TextHover')" />
                  </a-flex>
                </a-collapse-panel>

              </a-collapse>
            </template>
          </template>
        </a-tabs>
      </l-form>
    </l-menu-title-card>
  </div>
</template>
