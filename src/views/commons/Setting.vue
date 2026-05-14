<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LForm from "@/components/Form.vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import type {VNode} from "vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {CONFIG_PROVIDER, CONFIG_PROVIDER_THEME} from "@/constants/systemConstant.ts";
import type {
  CreateSuccessBackValue,
  IdValueMetadata,
  NameValueEnumMetadata,
  ThemeMode
} from "@/types";
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
  sizeOptions: NameValueEnumMetadata<string>[]
  createSuccessOptions: NameValueEnumMetadata<string>[]
  colorOptions:string[]
}>({
  colorOptions: ['colorPrimary', 'colorError', 'colorSuccess', 'colorWarning'],
  createSuccessOptions:[
    {
      name: globalProperties.$t('form.createSuccess.okReturnList'),
      value: CONFIG_PROVIDER.CREATE_SUCCESS_BACK.HOME
    },
    {
      name: globalProperties.$t('form.createSuccess.addAnother'),
      value: CONFIG_PROVIDER.CREATE_SUCCESS_BACK.CURRENT
    }
  ],
  sizeOptions:[
    {
      name: globalProperties.$t('setting.size.large'),
      value: 'large'
    },
    {
      name: globalProperties.$t('setting.size.middle'),
      value: 'middle'
    },
    {
      name: globalProperties.$t('setting.size.small'),
      value: 'small'
    }
  ],
  tabItems:[
    {
      id: globalProperties.$t('setting.colorSetting.text'),
      value: createIcon('icon-user-defined', 'align')
    },
    {
      id: globalProperties.$t('common.size'),
      value: createIcon('icon-customization', 'align')
    },
    {
      id: globalProperties.$t('common.style'),
      value: createIcon('icon-panorama', 'align')
    },
    {
      id: globalProperties.$t('common.other'),
      value: createIcon('icon-chengchangzhiyin', 'align')
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
  <div class="mx-auto my-0 max-w-250">
    <l-menu-title-card>
      <l-form>
        <a-row :gutter="[configProviderStore.getToken().marginMD]">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('common.lang')">
              <a-select @change="(value: string) => configProviderStore.changeLocale(value)" :value="configProviderStore.state.locale" :options="configProviderStore.getLocales()" :field-names="{label:'name'}"></a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item name="name" :label="globalProperties.$t('setting.theme.text')">
              <a-space-compact block>
                <a-select  @change="(value: string) => configProviderStore.setMode(value as ThemeMode)" :value="configProviderStore.state.theme"  :options="options.themeOptions" :field-names="{label:'name'}"></a-select>
                <a-space-addon>
                  {{ globalProperties.$t('setting.compact') }} :
                </a-space-addon>
                <a-space-addon>
                  <a-switch size="small" :checked="configProviderStore.state.compact" @change="(value: boolean) => configProviderStore.setCompact(value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
                </a-space-addon>
              </a-space-compact>
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
            <template v-if="item.key === globalProperties.$t('common.other')">
              <a-space orientation="vertical" class="w-full">

                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{ globalProperties.$t('setting.componentSize') }}
                  </a-typography-text>
                  <a-select @change="(value: string) => configProviderStore.setComponentSize(value)" :value="configProviderStore.state.componentSize" :options="options.sizeOptions" :field-names="{label:'name'}"/>
                </a-flex>

                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{ globalProperties.$t('setting.wireframe') }}
                  </a-typography-text>
                  <a-switch :checked="configProviderStore.getTokenValue('wireframe')" @change="(value: boolean) =>  configProviderStore.setTokenValue('wireframe', value)" :checked-children="globalProperties.$t('common.open')" :un-checked-children="globalProperties.$t('common.close')" />
                </a-flex>

                <a-flex justify="space-between" align="center" >
                  <a-typography-text strong>
                    {{ globalProperties.$t('setting.createSuccessBack') }}
                  </a-typography-text>
                  <a-select @change="(value: string) => configProviderStore.setCreateSuccessBack(value as CreateSuccessBackValue)" :value="configProviderStore.state.createSuccessBack" :options="options.createSuccessOptions" :field-names="{label:'name'}"/>
                </a-flex>

                <a-collapse :classes="{header: 'bg-container!'}">
                  <a-collapse-panel>
                    <template #header>
                      {{ globalProperties.$t('setting.colorSetting.prepare') }}
                    </template>
                    <template #extra>
                      <icon-font class="icon" type="icon-user-defined" />
                    </template>
                    <a-space orientation="vertical" class="w-full" >
                      <a-flex justify="space-between" align="center" :key="color" v-for="color in ['blue','purple','cyan','yellow','green','magenta','pink','volcano','lime','gold']">
                        <a-typography-text strong>
                          {{globalProperties.$t('setting.colorSetting.other.' + color)}}
                        </a-typography-text>
                        <a-color-picker  @change="(_color: Color) => colorChange(_color, color)" size="large" :default-value="configProviderStore.getTokenValue(color)" />
                      </a-flex>
                    </a-space>
                  </a-collapse-panel>
                  <a-collapse-panel>
                    <template #header>
                      {{globalProperties.$t('setting.other.transparency.text')}}
                    </template>
                    <template #extra>
                      <icon-font class="icon" type="icon-editor-background" />
                    </template>
                    <a-space orientation="vertical" class="w-full">
                      <a-flex justify="space-between" align="center" >
                        <a-typography-text strong>
                          {{globalProperties.$t('setting.other.transparency.loading')}}
                        </a-typography-text>
                        <a-input-number @change="(value:number) => configProviderStore.setTokenValue('opacityLoading', value)" :value="configProviderStore.getTokenValue('opacityLoading')"/>
                      </a-flex>
                      <a-flex justify="space-between" align="center">
                        <a-typography-text strong>
                          {{globalProperties.$t('setting.other.transparency.image')}}
                        </a-typography-text>
                        <a-input-number @change="(value:number) => configProviderStore.setTokenValue('opacityImage', value)" :value="configProviderStore.getTokenValue('opacityImage')"/>
                      </a-flex>
                    </a-space>
                  </a-collapse-panel>
                </a-collapse>
              </a-space>
            </template>
            <template v-if="item.key === globalProperties.$t('common.style')">
              <a-collapse :classes="{header: 'bg-container!'}">
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.borderRadius')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-editor-under-line" />
                  </template>
                  <a-space orientation="vertical" class="w-full">
                    <a-flex justify="space-between" align="center">
                      <a-typography-text strong>
                        {{globalProperties.$t('common.default')}}{{globalProperties.$t('setting.borderRadius')}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('borderRadius', value)" :value="configProviderStore.getTokenValue('borderRadius')"/>
                    </a-flex>
                    <a-flex justify="space-between" align="center" :key="size" v-for="size in ['sm','lg','xs']">
                      <a-typography-text strong>
                        {{globalProperties.$t('setting.borderRadius')}}，{{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('borderRadius' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('borderRadius' + size.toUpperCase())"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.boxShadow.text')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-editor-tag-subscript" />
                  </template>
                  <a-space orientation="vertical" class="w-full" >
                    <a-flex justify="space-between" align="center" >
                      <a-typography-text strong>
                        {{globalProperties.$t('common.default')}}{{globalProperties.$t('setting.boxShadow.text')}}
                      </a-typography-text>
                      <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadow', value)" :value="configProviderStore.getTokenValue('boxShadow')"/>
                    </a-flex>
                    <a-flex justify="space-between" align="center" >
                      <a-typography-text strong>
                        {{globalProperties.$t('setting.boxShadow.secondary')}}
                      </a-typography-text>
                      <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadowSecondary', value)" :value="configProviderStore.getTokenValue('boxShadowSecondary')"/>
                    </a-flex>
                    <a-flex justify="space-between" align="center" >
                      <a-typography-text strong>
                        {{globalProperties.$t('setting.boxShadow.tertiary')}}
                      </a-typography-text>
                      <a-input class="w-100" @change="(value:number) => configProviderStore.setTokenValue('boxShadowTertiary', value)" :value="configProviderStore.getTokenValue('boxShadowTertiary')"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
              </a-collapse>
            </template>
            <template v-if="item.key === globalProperties.$t('common.size')">

              <a-collapse :classes="{header: 'bg-container!'}">
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.size.common')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-editor-subscript" />
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
                        {{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('size' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('size' + size.toUpperCase())" />
                    </a-flex>
                  </a-space>
                </a-collapse-panel>

                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.font.text')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-editor-subscript" />
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
                        {{globalProperties.$t('setting.font.text')}}，{{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('fontSize' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('fontSize' + size.toUpperCase())" />
                    </a-flex>
                    <a-flex justify="space-between" align="center" v-for="number in 5" :key="number">
                      <a-typography-text strong>
                        {{globalProperties.$t('setting.font.heading',{number})}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('fontSizeHeading' + number, value)" :value="configProviderStore.getTokenValue('fontSizeHeading' + number)"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.lineHeight.text')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-editor-text" />
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
                        {{globalProperties.$t('setting.lineHeight.heading',{number})}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('lineHeightHeading' + number, value)" :value="configProviderStore.getTokenValue('lineHeightHeading' + number)"/>
                    </a-flex>
                    <a-flex justify="space-between" align="center" :key="size" v-for="size in ['sm','lg']">
                      <a-typography-text strong>
                        {{globalProperties.$t('setting.lineHeight.text')}}，{{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('lineHeight' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('lineHeight' + size.toUpperCase())"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.margin')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-gallery" />
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
                       {{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('margin' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('margin' + size.toUpperCase())"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
                <a-collapse-panel>
                  <template #header>
                    {{globalProperties.$t('setting.padding')}}
                  </template>
                  <template #extra>
                    <icon-font class="icon" type="icon-gallery" />
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
                        {{globalProperties.$t('setting.size.' + size)}}
                      </a-typography-text>
                      <a-input-number @change="(value:number) => configProviderStore.setTokenValue('padding' + size.toUpperCase(), value)" :value="configProviderStore.getTokenValue('padding' + size.toUpperCase())"/>
                    </a-flex>
                  </a-space>
                </a-collapse-panel>
              </a-collapse>
            </template>
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
                  <a-space orientation="vertical" class="w-full" >
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.active.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.active.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Active')" size="large" :value="configProviderStore.getTokenValue(id + 'Active')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.bg.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.bg.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Bg')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Bg')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.bgHover.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.bgHover.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BgHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BgHover')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.border.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.border.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Border')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Border')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.borderHover.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.borderHover.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'BorderHover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'BorderHover')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.hover.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.hover.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Hover')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Hover')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.colorText.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.colorText.subTitle') }}
                        </a-typography-text>
                      </a-flex>
                      <a-color-picker  @change="(color: Color) => colorChange(color, id + 'Text')" size="large" :default-value="configProviderStore.getTokenValue(id + 'Text')" />
                    </a-flex>
                    <a-flex justify="space-between" align="center">
                      <a-flex vertical :gap="2">
                        <a-typography-text strong>
                          {{ globalProperties.$t('setting.colorSetting.colorTextActive.title') }}
                        </a-typography-text>
                        <a-typography-text type="secondary" class="text-sm">
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
                        <a-typography-text type="secondary" class="text-sm">
                          {{ globalProperties.$t('setting.colorSetting.colorTextHover.subTitle') }}
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
    </l-menu-title-card>
  </div>
</template>
