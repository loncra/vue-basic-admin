<script setup lang="ts">
import imageSrc from '@/assets/403.svg'
import {usePrincipalStore} from "@/stores/principalStore.js"
import {type ComponentInternalInstance, getCurrentInstance} from 'vue'
import {requireNonNullOrUndefined} from "@/utils";
import {AUTHENTICATION_TYPE} from "@/constants";

defineOptions({
  name: 'ErrorForbidden'
})

const principalStore = usePrincipalStore();

const instance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const globalProperties = instance.appContext.config.globalProperties;

function logout() {
  globalProperties.$router.push({name: import.meta.env.VITE_APP_AUTH_PAGE_NAME, params:{authenticationType: (principalStore.state.type || AUTHENTICATION_TYPE.CONSOLE).toLowerCase()}})
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
              <template #icon>
                <icon-font class="icon align" type="loncra-undo-2"/>
              </template>
              <span>{{ globalProperties.$t('common.back') }}</span>
            </a-button>

            <a-button type="primary" @click="logout" >
              <template #icon>
                <icon-font class="icon align" type="loncra-log-out"/>
              </template>
              <span >{{ globalProperties.$t('auth.reLogin') }}</span>
            </a-button>
          </a-space>
        </div>
      </div>
    </a-flex>
  </div>
</template>
