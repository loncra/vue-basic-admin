<script setup lang="ts">

export interface LogoProps {
  /**
   * logo 标题
   */
  text?: string
  /**
   * logo icon
   */
  icon?: string
  /**
   * 是否隐藏 标题
   */
  hideText?: boolean
}

defineOptions({
  name: 'LLogo',
})

const props = withDefaults(defineProps<LogoProps>(), {
  text: 'Basic Admin',
  icon: 'icon-xiaojiage-l',
  hideText: false,
})
</script>

<template>
  <a-space size="small">
    <slot name="icon">
      <icon-font class="icon text-h1!" :type="props.icon"/>
    </slot>
    <a-typography-title class="mb-0" v-if="!props.hideText" :level="4">{{
        props.text
      }}
    </a-typography-title>
  </a-space>
</template>
