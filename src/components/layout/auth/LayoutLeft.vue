<script setup lang="ts">
import banner from '@/assets/信息服务.svg'
import LLogo from '@/components/Logo.vue'
import LayoutFooter from '@/components/layout/LayoutFooter.vue'
import type {LogoProps} from "@/types/composables";

defineOptions({
  name: 'LAuthLayoutRight',
})

export interface AuthLayoutLeftProps {
  /**
   * 标题
   */
  title?: string
  /**
   * 副标题
   */
  subTitle?: string
  /**
   * logo 配置
   */
  logo?: Partial<LogoProps>
}

const props = withDefaults(defineProps<AuthLayoutLeftProps>(), {
  title: '',
  subTitle: '',
  logo: () => ({}),
})
</script>

<template>
  <a-flex vertical class="h-full">
    <div class="p-lg">
      <l-logo :icon="props.logo.icon" :text="props.logo.text"/>
    </div>
    <a-flex vertical justify="center" align="center" flex="1">
      <a-image
        :src="banner"
        :preview="false"
        height="350px"
        width="350px"
        class="auth-banner-animate"
      />
      <a-typography-title class="mt-0 mb-xs" :level="3">
        {{ props.title }}
      </a-typography-title>
      <a-typography-title class="m-0" :level="5" type="secondary">
        {{ props.subTitle }}
      </a-typography-title>
    </a-flex>
    <layout-footer/>
  </a-flex>
</template>
