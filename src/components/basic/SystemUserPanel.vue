<script setup lang="ts">
import {AttachmentService} from "@/apis";
import type {ContactItem, PlatformUser} from "@/types/apis";
import type {ItemType} from "@antdv-next/x/dist/conversations/interface";
import {Conversations as AxConversations,} from '@antdv-next/x'
import {findAllTreeNodes, requireNonNullOrUndefined} from "@/utils";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  watch
} from "vue";

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

const modelValue = defineModel<PlatformUser[]>("value",{default:() => []})

const filterDataSource = computed(() => {
  return dataSource.value.filter(s => props.filter(s))
})

async function onContactActiveChange(value: string, item: ItemType | undefined) {
  if (!item || !(item as ContactItem)) {
    return;
  }
  const contact:ContactItem = item as ContactItem
  if (props.selected) {
    const find = modelValue.value.find(c => c.id === contact.data.id)
    if (find) {
      modelValue.value = modelValue.value.filter(c => c.id !== find.id)
    } else {
      modelValue.value = [contact.data, ...modelValue.value]
    }
  }
  emit("selected", contact.data)
}

function onSearch(value:string) {
  if (value === '') {
    dataSource.value = localDataSource.value;
  } else {
    dataSource.value = findAllTreeNodes((r) => getName(r.data).includes(value), localDataSource.value)
  }
}

function getName(c:PlatformUser) {
  return String(c.realName || c.username || globalProperties.$t('common.unname'))
}

onMounted(() => localDataSource.value = [...dataSource.value])

watch(dataSource.value, () => localDataSource.value = [...dataSource.value])

</script>

<template>
  <a-flex class="size-full">
    <a-flex vertical gap="middle" :class="'min-h-80 max-h-120 p-sm overflow-hidden ' + ((!props.selected || props.hideSelectPanel) ? 'w-full' : 'w-[30%]') " >
      <a-input-search @search="onSearch" v-if="!hideSearch""/>
      <ax-conversations
        :classes="{item:'chat-conversations-item p-xs! h-auto! min-h-auto! rounded-none!'}"
        :items="(filterDataSource || [])"
        :onActiveChange="onContactActiveChange"
        v-if="filterDataSource.length > 0"
        groupable
        class="min-h-0 size-full flex-[1_1_0] p-0! gap-0!">
        <template #iconRender="{ item }">
          <a-space>
            <a-checkbox v-if="props.selected" :checked="modelValue.some(d => d.id === item.data.id)" />
            <a-avatar
              :src="item?.data?.avatar ? AttachmentService.query(item?.data?.avatar.bucketName, item?.data?.avatar.objectName) : undefined"
              :size="props.avatarSize"
            >
              {{ item.label.substring(0, 1) }}
            </a-avatar>
          </a-space>
        </template>
        <template #labelRender="{item}">
          <a-flex vertical>
            <a-typography-text ellipsis class="flex-1">
              {{ item?.label }}
            </a-typography-text>
            <a-typography-text ellipsis type="secondary">
              {{ item?.data?.phoneNumber || item?.data?.email || ' ' }}
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
        <a-divider plain class="mt-0">
          已选择的成员
        </a-divider>
        <a-space wrap>
          <a-flex
            vertical
            justify="center"
            align="center"
            class="w-[50px]"
            v-for="c of modelValue"
            :key="c.id"
          >
            <a-avatar
              size="large"
              shape="square"
              v-if="c.avatar"
              :src="AttachmentService.query(c.avatar.bucketName, c.avatar.objectName)"
            />
            <a-avatar size="large" shape="square" v-else>
              {{ getName(c).substring(0,1) }}
            </a-avatar>
            <a-typography-text :ellipsis="{tooltip:getName(c)}">
              {{getName(c)}}
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
