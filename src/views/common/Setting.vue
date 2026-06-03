<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import {createIcon} from "@/utils";
import {ref} from "vue";
import LConfigProviderSetting from "@/components/setting/ConfigProviderSetting.vue";
import LAccountSetting from "@/components/setting/AccountSetting.vue";

defineOptions({
  name: 'CommonSetting'
})

const tabList = [
  {
    key: 'accountSetting',
    tab: '账户设置',
    icon:createIcon('loncra-user-round-cog', 'align')
  },
  {
    key: 'configProviderSetting',
    tab: '系统设置',
    icon:createIcon('loncra-sliders-horizontal', 'align')
  },
]

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
