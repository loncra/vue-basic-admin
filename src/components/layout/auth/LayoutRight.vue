<script setup lang="ts">
import LAuthForm from '@/components/layout/auth/Form.vue'
import LLogo, { type LogoProps } from '@/components/Logo.vue'

defineOptions({
  name: 'LAuthLayoutRight',
})

export interface AuthLayoutRightProps {
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

const props = withDefaults(defineProps<AuthLayoutRightProps>(), {
  title: '',
  subTitle: '',
  logo: () => ({}),
})
</script>

<template>
  <a-flex vertical class="h-full">
    <a-flex align="center" class="p-sm justify-between lg:justify-end">
      <l-logo class="lg:hidden ml-sm" :text="props.logo.text" :icon="props.logo.icon" />
    </a-flex>
    <a-flex vertical justify="center" class="pl-xl pr-xl h-full">
      <a-typography-title :level="2">
        {{ props.title }}
      </a-typography-title>
      <a-typography-text type="secondary">{{ props.subTitle }}</a-typography-text>
      <l-auth-form />
    </a-flex>
  </a-flex>
</template>
