<script setup lang="ts">

import type {LogoProps} from '@/types/composables/common'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {type ComponentInternalInstance, computed, getCurrentInstance} from "vue";
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON,
  AUTHENTICATION_MEMBER_TYPE,
  AUTHENTICATION_TYPE,
  ICON_SELECT_AVATAR_MODE_VALUE
} from "@/constants";
import {createIcon, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LIconSelect from "@/components/basic/IconSelect.vue";
import type {PersonalEnterprise} from "@/types/apis";

defineOptions({
  name: 'LLogo',
})

const props = withDefaults(defineProps<LogoProps>(), {
  text: 'Basic Admin',
  icon: 'icon-xiaojiage-l',
  hideText: false,
})

const principalStore = usePrincipalStore()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const switchItems = computed(()=>{
  if (principalStore.state.enterpriseDataSource.length <= 0) {
    return []
  }
  const result = []
  result.push({
    type:'group',
    label:globalProperties.$t('systemSetting.enterprise.title'),
    key:AUTHENTICATION_TYPE.ENTERPRISE,
    icon:createIcon('loncra-building', 'align'),
    children:principalStore
      .state
      .enterpriseDataSource
      .map(item => ({
        data:item,
        label:item.name,
        key:getMenuItemKey(AUTHENTICATION_TYPE.ENTERPRISE,item.tenantId),
        menuType:AUTHENTICATION_TYPE.ENTERPRISE
      }))
  },{
    type: 'divider',
  },{
    label:principalStore.getName(),
    key:getMenuItemKey(AUTHENTICATION_TYPE.PERSONAL,principalStore.state.details.metadata.tenantId),
    menuType:AUTHENTICATION_TYPE.PERSONAL,
  })
  return result
})

function getMenuItemKey(type:string, tenantId:string) {
  return type + ":" + tenantId
}

function getWorkspaceId(key:string) : number | undefined {
  const [type, tenantId] = key.split(":")
  if (!tenantId || type === AUTHENTICATION_TYPE.PERSONAL) {
    return undefined
  }
  return principalStore.state.enterpriseDataSource.find(item => item.tenantId === tenantId)?.id
}

const currentItem = computed<PersonalEnterprise | undefined>(() => {
  const dataSource = principalStore.state.enterpriseDataSource || [];
  return dataSource.find(item => item.tenantId === principalStore.state.details.metadata.tenantId)
})

async function onSwitch(item: { key:string }) {
  await principalStore.switchWorkspace(getWorkspaceId(item.key))
}

</script>

<template>
  <a-flex align="center" gap="small" class="w-full">
    <a-flex class="shrink-0" v-if="currentItem" >
      <l-icon-select size="large" preview :value="currentItem.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + currentItem.name" />
    </a-flex>
    <slot name="icon" v-else>
      <icon-font class="icon shrink-0 text-h1! leading-none" :type="props.icon"/>
    </slot>
    <a-typography-text class="text-xl flex-1 w-full" strong v-if="!props.hideText">
      <template v-if="currentItem">
        {{currentItem.name}}
      </template>
      <template v-else>
        {{props.text}}
      </template>
    </a-typography-text>
    <a-dropdown
      v-if="switchItems.length > 0 && !props.hideText"
      @menu-click="onSwitch"
      :menu="{
        items: switchItems,
        selectable: true,
        defaultSelectedKeys:[getMenuItemKey(principalStore.state.type,principalStore.state.details.metadata.tenantId)]
      }"
      placement="bottomLeft"
      :arrow="{ pointAtCenter: true }"
    >
      <a-button class="shrink-0" size="small" type="text" shape="circle" :loading="principalStore.state.switchingWorkspace">
        <template #icon v-if="!principalStore.state.switchingWorkspace">
          <icon-font type="loncra-repeat" />
        </template>
      </a-button>
      <template #labelRender="item">
        <template v-if="AUTHENTICATION_MEMBER_TYPE.includes(item.menuType)">
          <a-flex
            gap="small"
            align="center"
            v-if="item.menuType === AUTHENTICATION_TYPE.ENTERPRISE"
          >
            <a-tag :color="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR[Number(getEnumValue(item.data.role))] || 'purple'" variant="outlined">
              <template #icon>
                <icon-font :type="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON[Number(getEnumValue(item.data.role))]"/>
              </template>
            </a-tag>
            <span>
              {{ item.label }}
            </span>
          </a-flex>
          <a-flex
            gap="small"
            align="center"
            v-else
          >
            <a-tag color="blue" variant="outlined">
              <template #icon>
                <icon-font type="loncra-user"/>
              </template>
              {{$t('auth.personalAccount')}}
            </a-tag>
            <span>
              {{ principalStore.getName()}}
            </span>
          </a-flex>
        </template>
      </template>
    </a-dropdown>
  </a-flex>
</template>
