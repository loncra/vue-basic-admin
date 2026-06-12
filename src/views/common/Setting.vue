<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import LConfigProviderSetting from "@/components/setting/ConfigProviderSetting.vue";
import LAccountSetting from "@/components/setting/AccountSetting.vue";

defineOptions({
  name: 'CommonSetting'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const tabList = computed(()=> [
  {
    key: 'accountSetting',
    tab: globalProperties.$t('systemSetting.tab.accountSetting'),
    icon:createIcon('loncra-user-round-cog', 'align')
  },
  {
    key: 'configProviderSetting',
    tab: globalProperties.$t('systemSetting.tab.configProviderSetting'),
    icon:createIcon('loncra-sliders-horizontal', 'align')
  },
])

const activeTabKey = ref<string>('accountSetting')

</script>

<template>
  <div class="mx-auto my-0 max-w-250">
    <l-menu-title-card
      :tab-list="tabList"
      hide-title
      :active-tab-key="activeTabKey"
      @tab-change="(key:string) => activeTabKey = key"
    >
      <template v-if="activeTabKey === 'accountSetting'">
        <l-account-setting />
      </template>
      <template v-if="activeTabKey === 'configProviderSetting'">
        <l-config-provider-setting />
      </template>
    </l-menu-title-card>
  </div>
</template>
