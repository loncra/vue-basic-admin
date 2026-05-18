<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import imageSrc from '@/assets/400.svg'
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'ErrorBadRequest',
})

const instance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
const globalProperties = instance.appContext.config.globalProperties;

const options = ref({
  dataSource: [],
  columns: [
    {
      title: globalProperties.$t('error.code'),
      dataIndex: "code",
      ellipsis: true,
      width: 200
    },
    {
      title: globalProperties.$t('error.field'),
      dataIndex: "field",
      ellipsis: true,
      width: 200
    },
    {
      title: globalProperties.$t('error.errorMessage'),
      dataIndex: "defaultMessage",
      ellipsis: true,
      width: 300
    }
  ]
});

function mounted() {
  const value = sessionStorage.getItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME);
  if (!value) {
    return ;
  }
  const json = JSON.parse(value) || [];
  if (json.length > 0) {
    options.value.dataSource = json;
  }
  sessionStorage.removeItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME);
}

onMounted(mounted)

</script>

<template>
  <div>
    <a-flex class="h-full" justify="center" align="center">
      <div>
        <div class="text-center">
          <a-image :src="imageSrc" :preview="false" :height="400"/>
        </div>
        <a-divider>{{ globalProperties.$t('error.badRequest.title') }}</a-divider>
        <a-table :pagination="false"
                 :data-source="options.dataSource"
                 :columns="options.columns"
                 :scroll="{ x: 'max-content'}"
                 bordered>
        </a-table>
        <div class="text-center mt-lg">
          <a-button @click="globalProperties.$router.go(-1);">
            <icon-font class="icon align" type="icon-return"/>
            <span>{{ globalProperties.$t('common.back') }}</span>
          </a-button>
        </div>
      </div>
    </a-flex>
  </div>

</template>
