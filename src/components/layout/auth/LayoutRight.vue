<script setup lang="ts">
import LAuthForm from '@/components/layout/auth/AuthForm.vue'
import LLogo from '@/components/Logo.vue'
import type {LogoProps} from "@/types/composables";

defineOptions({
  name: 'LAuthLayoutRight',
})

const props = withDefaults(defineProps<LogoProps>(), {
})
</script>

<template>
  <a-flex vertical class="h-full">
    <a-flex align="center" class="p-sm justify-between lg:justify-end">
      <l-logo class="lg:hidden ml-sm" :text="props.text" :icon="props.icon"/>
    </a-flex>
    <a-flex vertical justify="center" class="pl-xl pr-xl h-full">
      <l-auth-form/>
    </a-flex>
  </a-flex>
</template>
