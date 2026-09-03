<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import LConfigProviderSetting from "@/components/setting/ConfigProviderSetting.vue";
import LAccountSetting from "@/components/setting/AccountSetting.vue";
import LEnterpriseSetting from "@/components/setting/EnterpriseSetting.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {AUTHENTICATION_TYPE} from "@/constants";

defineOptions({
  name: 'CommonSetting'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const tabList = computed(()=> {
  const result = [
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
  ]

  if (principalStore.state.type === AUTHENTICATION_TYPE.PERSONAL) {
    result.push({
      key: 'enterpriseSetting',
      tab: globalProperties.$t('systemSetting.tab.enterpriseSetting'),
      icon:createIcon('loncra-building', 'align')
    })
  }

  return result
})

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
      <template v-if="activeTabKey === 'enterpriseSetting'">
        <l-enterprise-setting />
      </template>
    </l-menu-title-card>
  </div>
</template>
