<script setup lang="ts">
import {AuthServerService} from "@/apis";
import type {ContactItem, PlatformUser} from "@/types/apis";
import type {ItemType} from "@antdv-next/x/dist/conversations/interface";
import {Conversations as AxConversations,} from '@antdv-next/x'
import {requireNonNullOrUndefined} from "@/utils";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  watch
} from "vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";

defineOptions({
  name: 'LSystemUserPanel',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const dataSource = defineModel<ContactItem[]>('dataSource', {default:() => []})

const props = withDefaults(defineProps<{
  selected?:boolean
  filter?:(item:ContactItem) => boolean
  hideSelectPanel?:boolean
  hideSearch?:boolean
  avatarSize?:string
}>(),{
  selected:true,
  hideSearch:false,
  hideSelectPanel:false,
  filter:()=> true,
  avatarSize:'large'
})

const emit = defineEmits<{
  selected: [body: PlatformUser]
}>()

const localDataSource = ref<ContactItem[]>([])

const modelValue = defineModel<ContactItem[]>("value",{default:() => []})
const searchValue = ref<string>('')

const filterDataSource = computed(() => {
  return dataSource.value
    .filter(s => searchValue.value === '' ? s : AuthServerService.getPrincipalNameByUserDetails(s.data).includes(searchValue.value))
    .filter(s => props.filter(s))
})

async function onContactActiveChange(value: string, item: ItemType | undefined) {
  if (!item || !(item as ContactItem)) {
    return;
  }
  const contact:ContactItem = item as ContactItem
  if (props.selected) {
    const find = modelValue.value.find(c => c.key === contact.key)
    if (find) {
      modelValue.value = modelValue.value.filter(c => c.key !== find.key)
    } else {
      modelValue.value = [contact, ...modelValue.value]
    }
  }
  emit("selected", contact.data)
}

onMounted(() => localDataSource.value = [...dataSource.value])

watch(dataSource.value, () => localDataSource.value = [...dataSource.value])

</script>

<template>
  <a-flex class="size-full">
    <a-flex vertical :class="'min-h-80 max-h-120 overflow-hidden ' + ((!props.selected || props.hideSelectPanel) ? 'w-full' : 'w-[30%]') " >
      <div class="shrink-0 p-sm">
        <a-input v-model:value="searchValue">
          <template #suffix>
            <icon-font class="text-text-quaternary" type="loncra-user-search"/>
          </template>
        </a-input>
      </div>
      <ax-conversations
        :classes="{item:'chat-conversations-item p-xs! h-auto! min-h-auto! rounded-none!'}"
        :items="(filterDataSource || [])"
        :onActiveChange="onContactActiveChange"
        v-if="filterDataSource.length > 0"
        groupable
        class="min-h-0 size-full flex-[1_1_0] p-0! gap-0!">
        <template #iconRender="{ item }">
          <a-space>
            <a-checkbox v-if="props.selected" :checked="modelValue.some(d => d.key === item.key)" />
            <l-user-avatar :user="item.data" :size="props.avatarSize"/>
          </a-space>
        </template>
        <template #labelRender="{item}">
          <a-flex vertical>
            <a-typography-text ellipsis class="flex-1">
              {{ item?.label }}
            </a-typography-text>
            <a-typography-text ellipsis type="secondary">
              <template v-if="item?.data?.phoneNumber">
                {{globalProperties.$t('common.phoneNumber')}}: {{item?.data?.phoneNumber}}
              </template>
              <template v-if="item?.data?.email">
                {{globalProperties.$t('common.email')}}: {{item?.data?.email}}
              </template>
            </a-typography-text>
          </a-flex>
        </template>
      </ax-conversations>
      <a-flex v-else justify="center" align="center" class="size-full">
        <a-empty/>
      </a-flex>
    </a-flex>
    <a-flex vertical v-if="props.selected && !props.hideSelectPanel" class="min-h-80 max-h-120 p-sm w-[70%]">
      <div v-if="modelValue.length > 0">
        <a-divider plain class="mt-0" orientation="left">
          <a-space>
            <icon-font type="loncra-user-check"/>
            {{globalProperties.$t('component.systemUserPanel.selectedMember')}}
          </a-space>
        </a-divider>
        <a-space wrap>
          <a-flex
            vertical
            justify="center"
            align="center"
            class="w-12.5"
            v-for="c of modelValue"
            :key="c.data.id"
          >
            <l-user-avatar :user="c.data" size="large" shape="square"/>
            <a-typography-text :ellipsis="{tooltip:AuthServerService.getPrincipalNameByUserDetails(c.data)}">
              {{ AuthServerService.getPrincipalNameByUserDetails(c.data) }}
            </a-typography-text>
          </a-flex>
        </a-space>
      </div>
      <a-flex v-else justify="center" align="center" class="size-full">
        <a-empty/>
      </a-flex>
    </a-flex>
  </a-flex>
</template>
