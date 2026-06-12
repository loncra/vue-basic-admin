<script setup lang="ts">

import type {Color} from "antdv-next";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import LForm from "@/components/Form.vue";
import {
  CONFIG_PROVIDER_THEME,
  CREATE_SUCCESS_BACK,
  type CreateSuccessBackValue,
  type ThemeMode
} from "@/constants/configProviderConstant.ts";

defineOptions({
  name: 'LConfigProviderSetting',
})

const configProviderStore = useConfigProviderStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const colorOptions = ref<string[]>(['colorPrimary', 'colorError', 'colorSuccess', 'colorWarning'])

const createSuccessOptions = computed(() => [
  { name: globalProperties.$t('form.createSuccess.okReturnList'), value: CREATE_SUCCESS_BACK.HOME },
  { name: globalProperties.$t('form.createSuccess.addAnother'), value: CREATE_SUCCESS_BACK.CURRENT },
])

const sizeOptions = computed(() => [
  { name: globalProperties.$t('systemSetting.size.large'), value: 'large' },
  { name: globalProperties.$t('systemSetting.size.middle'), value: 'middle' },
  { name: globalProperties.$t('systemSetting.size.small'), value: 'small' },
])

const tabItems = computed(() => [
  {
    metadata: {
      key:'colorSetting',
    },
    id: globalProperties.$t('systemSetting.colorSetting.text'),
    value: createIcon('loncra-paint-bucket', 'align')
  },
  {
    metadata: {
      key:'size',
    },
    id: globalProperties.$t('common.size'),
    value: createIcon('loncra-pencil-ruler', 'align')
  },
  {
    metadata: {
      key:'style',
    },
    id: globalProperties.$t('common.style'),
    value: createIcon('loncra-line-style', 'align')
  },
  {
    metadata: {
      key:'other',
    },
    id: globalProperties.$t('common.other'),
    value: createIcon('loncra-signpost-big', 'align')
  }
])

const themeOptions = computed(() => [
  { name: globalProperties.$t('systemSetting.theme.system'), value: CONFIG_PROVIDER_THEME.SYSTEM },
  { name: globalProperties.$t('systemSetting.theme.dark'), value: CONFIG_PROVIDER_THEME.DARK },
  { name: globalProperties.$t('systemSetting.theme.light'), value: CONFIG_PROVIDER_THEME.LIGHT },
])

function colorChange(_color: Color, tokenKey: string): void {
  configProviderStore.setTokenValue(tokenKey, _color.toHexString())
}

</script>

<template>
  <l-form>
    <a-row :gutter="[configProviderStore.getToken().marginMD]">
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="name" :label="globalProperties.$t('common.lang')">
          <a-select @change="(value: string) => configProviderStore.changeLocale(value)" :value="configProviderStore.state.locale" :options="configProviderStore.getLocales()" :field-names="{label:'name'}"></a-select>
        </a-form-item>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="name" :label="globalProperties.$t('systemSetting.theme.text')">
          <a-space-compact block>
            <a-select  @change="(value: string) => configProviderStore.setMode(value as ThemeMode)" :value="configProviderStore.state.theme"  :options="themeOptions" :field-names="{label:'name'}"></a-select>
            <a-space-addon>
              {{ globalProperties.$t('systemSetting.compact') }} :
            </a-space-addon>
            <a-space-addon>
              <a-switch size="small" :checked="configProviderStore.state.compact" @change="(value: boolean) => configProviderStore.setCompact(value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
            </a-space-addon>
          </a-space-compact>
        </a-form-item>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="name" :label="globalProperties.$t('systemSetting.home.homeSiderWidth')">
          <a-input-number class="w-full" @change="(value: number) => configProviderStore.setHomeSiderWidth(value)" :value="configProviderStore.state.homeSiderWidth" />
        </a-form-item>
      </a-col>
      <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
        <a-form-item name="name" :label="globalProperties.$t('systemSetting.home.homeCollapsedWidth')">
          <a-space-compact block>
            <a-input-number class="w-full" @change="(value: number) => configProviderStore.setHomeCollapsedWidth(value)" :value="configProviderStore.state.homeCollapsedWidth" />
            <a-space-addon>
              <a-switch size="small" :checked="configProviderStore.state.homeCollapsible" @change="(value: boolean) => configProviderStore.setHomeCollapsible(value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
            </a-space-addon>
          </a-space-compact>
        </a-form-item>
      </a-col>

    </a-row>
    <a-tabs centered :items="tabItems.map(item => ({key: item.metadata?.key, label: item.id, icon: item.value}))">
      <template #contentRender="{item}">
        <template v-if="item.key === 'other'">
          <a-space orientation="vertical" class="w-full">

            <a-flex justify="space-between" align="center" >
              <a-typography-text strong>
                {{ globalProperties.$t('systemSetting.componentSize') }}
              </a-typography-text>
              <a-select @change="(value: string) => configProviderStore.setComponentSize(value)" :value="configProviderStore.state.componentSize" :options="sizeOptions" :field-names="{label:'name'}"/>
            </a-flex>

            <a-flex justify="space-between" align="center" >
              <a-typography-text strong>
                {{ globalProperties.$t('systemSetting.wireframe') }}
              </a-typography-text>
              <a-switch :checked="configProviderStore.getTokenValue('wireframe')" @change="(value: boolean) =>  configProviderStore.setTokenValue('wireframe', value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
            </a-flex>

            <a-flex justify="space-between" align="center" >
              <a-typography-text strong>
                {{ globalProperties.$t('systemSetting.createSuccessBack') }}
              </a-typography-text>
              <a-select @change="(value: string) => configProviderStore.setCreateSuccessBack(value as CreateSuccessBackValue)" :value="configProviderStore.state.createSuccessBack" :options="createSuccessOptions" :field-names="{label:'name'}"/>
            </a-flex>

            <a-collapse :classes="{header: 'bg-container!'}">
              <a-collapse-panel>
                <template #header>
                  {{ globalProperties.$t('systemSetting.colorSetting.prepare') }}
                </template>
                <template #extra>
                  <icon-font class="icon" type="loncra-paint-bucket" />
                </template>
                <a-space orientation="vertical" class="w-full" >
                  <a-flex justify="space-between" align="center" :key="color" v-for="color in ['blue','purple','cyan','yellow','green','magenta','pink','volcano','lime','gold']">
                    <a-typography-text strong>
                      {{globalProperties.$t('systemSetting.colorSetting.other.' + color)}}
                    </a-typography-text>
                    <a-color-picker  @change="(_color: Color) => colorChange(_color, color)" size="large" :default-value="configProviderStore.getTokenValue(color)" />
                  </a-flex>
                </a-space>
              </a-collapse-panel>
              <a-collapse-panel>
                <template #header>
                  {{globalProperties.$t('systemSetting.other.transparency.text')}}
                </template>
                <template #extra>
                  <icon-font class="icon" type="loncra-squares-intersect" />
                </template>
                <a-space orientation="vertical" class="w-full">
                  <a-flex justify="space-between" align="center" >
                    <a-typography-text strong>
                      {{globalProperties.$t('systemSetting.other.transparency.loading')}}
                    </a-typography-text>
                    <a-input-number @change="(value:number) => configProviderStore.setTokenValue('opacityLoading', value)" :value="configProviderStore.getTokenValue('opacityLoading')"/>
                  </a-flex>
                  <a-flex justify="space-between" align="center">
                    <a-typography-text strong>
                      {{globalProperties.$t('systemSetting.other.transparency.image')}}
                    </a-typography-text>
                    <a-input-number @change="(value:number) => configProviderStore.setTokenValue('opacityImage', value)" :value="configProviderStore.getTokenValue('opacityImage')"/>
                  </a-flex>
                </a-space>
              </a-collapse-panel>
            </a-collapse>
          </a-space>
        </template>
        <template v-if="item.key === 'style'">
          <a-collapse :classes="{header: 'bg-container!'}">
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.borderRadius')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-radius" />
              </template>
              <a-space orientation="vertical" class="w-full">
                <a-flex justify="space-between" align="center">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}{{globalProperties.$t('systemSetting.borderRadius')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('borderRadius', value)" :value="configProviderStore.getTokenValue('borderRadius')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['sm','lg','xs']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.borderRadius')}}，{{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('borderRadius' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('borderRadius' + size.toUpperCase())"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.boxShadow.text')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-squares-subtract" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}{{globalProperties.$t('systemSetting.boxShadow.text')}}
                  </a-typography-text>
                  <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadow', value)" :value="configProviderStore.getTokenValue('boxShadow')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.boxShadow.secondary')}}
                  </a-typography-text>
                  <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadowSecondary', value)" :value="configProviderStore.getTokenValue('boxShadowSecondary')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.boxShadow.tertiary')}}
                  </a-typography-text>
                  <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadowTertiary', value)" :value="configProviderStore.getTokenValue('boxShadowTertiary')"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
          </a-collapse>
        </template>
        <template v-if="item.key === 'size'">

          <a-collapse :classes="{header: 'bg-container!'}">
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.size.common')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-ruler-dimension-line" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('size', value)" :value="configProviderStore.getTokenValue('size')" />
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['lg','md','sm','xl','xs','xxl','xxs']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('size' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('size' + size.toUpperCase())" />
                </a-flex>
              </a-space>
            </a-collapse-panel>

            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.font.text')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-file-type-corner" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('fontSize', value)" :value="configProviderStore.getTokenValue('fontSize')" />
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['sm','lg','xl']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.font.text')}}，{{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('fontSize' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('fontSize' + size.toUpperCase())" />
                </a-flex>
                <a-flex justify="space-between" align="center" v-for="number in 5" :key="number">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.font.heading',{number})}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('fontSizeHeading' + number, value)" :value="configProviderStore.getTokenValue('fontSizeHeading' + number)"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.lineHeight.text')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-unfold-vertical" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('lineHeight', value)" :value="configProviderStore.getTokenValue('lineHeight')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" v-for="number in 5" :key="number">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.lineHeight.heading',{number})}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('lineHeightHeading' + number, value)" :value="configProviderStore.getTokenValue('lineHeightHeading' + number)"/>
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['sm','lg']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.lineHeight.text')}}，{{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('lineHeight' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('lineHeight' + size.toUpperCase())"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.margin')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-bring-to-front" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('margin', value)" :value="configProviderStore.getTokenValue('margin')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['lg', 'md', 'sm', 'xl', 'xs', 'xxl', 'xxs']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('margin' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('margin' + size.toUpperCase())"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
            <a-collapse-panel>
              <template #header>
                {{globalProperties.$t('systemSetting.padding')}}
              </template>
              <template #extra>
                <icon-font class="icon" type="loncra-panel-top-bottom-dashed" />
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center">
                  <a-typography-text strong>
                    {{globalProperties.$t('common.default')}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('padding', value)" :value="configProviderStore.getTokenValue('padding')"/>
                </a-flex>
                <a-flex justify="space-between" align="center" :key="size" v-for="size in ['lg', 'md', 'sm', 'xl', 'xs', 'xxs']">
                  <a-typography-text strong>
                    {{globalProperties.$t('systemSetting.size.' + size)}}
                  </a-typography-text>
                  <a-input-number @change="(value:number) => configProviderStore.setTokenValue('padding' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('padding' + size.toUpperCase())"/>
                </a-flex>
              </a-space>
            </a-collapse-panel>
          </a-collapse>
        </template>
        <template v-if="item.key === 'colorSetting'">
          <a-collapse :classes="{header: 'bg-container!'}">
            <a-collapse-panel :key="id" v-for="id of colorOptions">
              <template #header>
                {{globalProperties.$t('systemSetting.colorSetting.' + id)}}
              </template>
              <template #extra>
                      <span @click.stop>
                        <a-color-picker size="small" @change="(color: Color) => colorChange(color, id)" :value="configProviderStore.getTokenValue(id)" />
                      </span>
              </template>
              <a-space orientation="vertical" class="w-full" >
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.active.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.active.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Active')" size="large" :value="configProviderStore.getTokenValue(id + 'Active')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.bg.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.bg.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Bg')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Bg')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.bgHover.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.bgHover.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BgHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BgHover')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.border.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.border.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Border')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Border')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.borderHover.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.borderHover.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BorderHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BorderHover')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.hover.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.hover.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Hover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Hover')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.colorText.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.colorText.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Text')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Text')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.colorTextActive.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.colorTextActive.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'TextActive')" size="large" :default-value="configProviderStore.getTokenValue(id + 'TextActive')" />
                </a-flex>
                <a-flex justify="space-between" align="center">
                  <a-flex vertical :gap="2">
                    <a-typography-text strong>
                      {{ globalProperties.$t('systemSetting.colorSetting.colorTextHover.title') }}
                    </a-typography-text>
                    <a-typography-text type="secondary" class="text-sm">
                      {{ globalProperties.$t('systemSetting.colorSetting.colorTextHover.subTitle') }}
                    </a-typography-text>
                  </a-flex>
                  <a-color-picker  @change="(color: Color) => colorChange(color, id + 'TextHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'TextHover')" />
                </a-flex>
              </a-space>
            </a-collapse-panel>
          </a-collapse>
        </template>
      </template>
    </a-tabs>
  </l-form>
</template>

