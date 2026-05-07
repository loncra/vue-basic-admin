<script setup lang="ts">
import LAuthLayoutRight, {
  type AuthLayoutRightProps,
} from '@/components/layout/auth/LayoutRight.vue'
import LAuthLayoutLeft, {type AuthLayoutLeftProps} from '@/components/layout/auth/LayoutLeft.vue'

defineOptions({
  name: 'LAuthLayout',
})

export interface AuthLayoutProp {
  left?: Partial<AuthLayoutLeftProps>
  right?: Partial<AuthLayoutRightProps>
}

const props = withDefaults(defineProps<AuthLayoutProp>(), {
  left: () => ({}),
  right: () => ({}),
})
</script>

<template>
  <div class="h-screen min-h-150">
    <a-row class="h-full">
      <a-col
        :xs="0"
        :sm="0"
        :md="0"
        :lg="14"
        :xl="16"
        :xxl="16"
        class="h-full auth-background"
      >
        <l-auth-layout-left
          :title="props.left.title || $t('auth.title')"
          :sub-title="props.left.subTitle || $t('auth.subTitle')"
          :logo="props.left.logo"
        />
      </a-col>
      <a-col
        :xs="24"
        :sm="24"
        :md="24"
        :lg="10"
        :xl="8"
        :xxl="8"
        class="h-full bg-container shadow-ter border-l border-l-border-secondary border-solid"
      >
        <l-auth-layout-right
          :title="props.left.title || $t('auth.welcomeTitle')"
          :sub-title="props.left.subTitle || $t('auth.welcomeSubTitle')"
          :logo="props.left.logo"
        />
      </a-col>
    </a-row>
  </div>
</template>
