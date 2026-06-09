<script setup lang="ts">
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  onActivated,
  onMounted,
  provide,
  ref,
  type VNode
} from "vue";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {findFirstTreeNode, requireNonNullOrUndefined} from "@/utils";
import {MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from "@/constants/systemConstant.ts";

defineOptions({
  name: 'CommonMyMessage',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const messageServerStore = useMessageServerStore()
const menuPrincipalStore = useMenuPrincipalStore()
const segmented = ref<{
  value:string
  data:Record<string, unknown>[]
}>({
  value:'',
  data:[]
})

const extraContent = ref<VNode>();
provide(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY, (comp:VNode) => extraContent.value = comp);

function onSegmented(value:string) {
  segmented.value.value = value;
  globalProperties.$router.push({ name: value });
}

function mounted() {
  const menu = findFirstTreeNode((m) => m.code === 'my_message',menuPrincipalStore.state.menu)
  if (menu && (menu?.children || []).length > 0) {
    segmented.value.data = (menu.children || []).map(r => ({name:r.name, value:r.code,iconText:r.icon}))
  }
  activated()
}

function activated(){
  const current = segmented.value.data.find(v => v.value === globalProperties.$route.name)
  if (current && current.value) {
    segmented.value.value = String(current.value)
  }
}

onMounted(mounted)

onActivated(activated)
</script>

<template>
  <div class="h-full min-h-0">
    <l-menu-title-card
      :classes="{
        root:'min-h-0 flex flex-col h-full shadow-ter',
        header: 'shrink-0',
        body:'flex flex-1 min-h-120 p-0! overflow-hidden'
      }"
    >
      <template #extra v-if="extraContent">
        <div>
          <component :is="extraContent" />
        </div>
      </template>
      <div class="h-full min-h-0 p-xs bg-layout border-r border-r-border-secondary">
        <a-segmented size="large" orientation="vertical" v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
          <template #iconRender="{ iconText,value }">
            <a-badge dot :count="messageServerStore.getUnreadQuantityByType(value)">
              <icon-font class="icon align" :type="iconText" />
            </a-badge>
          </template>
        </a-segmented>
      </div>
      <div class="min-h-0 size-full overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
              <keep-alive v-if="Component">
                <component :is="Component" />
              </keep-alive>
          </transition>
        </router-view>
      </div>
    </l-menu-title-card>
  </div>
</template>
