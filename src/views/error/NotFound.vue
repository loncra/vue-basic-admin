<script setup lang="ts">
import imageSrc from '@/assets/404.svg'
import {type ComponentInternalInstance, getCurrentInstance} from 'vue'
import {requireNonNullOrUndefined} from '@/utils'
defineOptions({
  name: 'ErrorNotFound',
})
const instance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const globalProperties = instance.appContext.config.globalProperties
</script>

<template>
  <a-flex class="min-h-screen w-full" justify="center" align="center">
    <div class="px-md">
      <div class="text-center">
        <a-image :src="imageSrc" :preview="false" :height="400" />
      </div>
      <a-divider>{{ globalProperties.$t('error.notFound.title') }}</a-divider>
      <div class="text-center">
        <a-space>
          <a-button @click="globalProperties.$router.go(-1)">
            <template #icon>
              <icon-font class="icon align" type="icon-return" />
            </template>
            <span>{{ globalProperties.$t('common.back') }}</span>
          </a-button>

          <a-button type="primary" @click="globalProperties.$router.push({ path: '/' })">
            <template #icon>
              <icon-font class="icon align" type="icon-home" />
            </template>
            <span>{{ globalProperties.$t('common.home') }}</span>
          </a-button>
        </a-space>
      </div>
    </div>
  </a-flex>
</template>
