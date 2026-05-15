

<script setup lang="ts">
import imageSrc from '@/assets/403.svg'
import {usePrincipalStore} from "@/stores/principalStore.js"
import {type ComponentInternalInstance, getCurrentInstance} from 'vue'
import {requireNonNullOrUndefined} from "@/utils";

const principalStore = usePrincipalStore();

const instance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const globalProperties = instance.appContext.config.globalProperties;

function logout() {
  const type = principalStore.state.type
  globalProperties.$router.push("/login?authenticationType=" + type);
}
</script>

<template>
  <div>
    <a-flex class="h-full" justify="center" align="center">
      <div>
        <div class="text-center">
          <a-image :src="imageSrc" :preview="false" :height="400"/>
        </div>
        <a-divider>{{ globalProperties.$t('error.forbidden.title') }}</a-divider>
        <div class="text-center">
          <a-space>
            <a-button @click="globalProperties.$router.go(-1);">
              <icon-font class="icon" type="icon-left-arrow"/>
              <span>{{ globalProperties.$t('common.back') }}</span>
            </a-button>

            <a-button type="primary" @click="logout" >
              <icon-font type="icon-sign-out"/>
              <span >{{ globalProperties.$t('auth.reLogin') }}</span>
            </a-button>
          </a-space>
        </div>
      </div>
    </a-flex>
  </div>
</template>
