<script setup lang="ts">


import type {CurdAuthorityProps} from "@/types";
import {onMounted, ref} from "vue";
import type {MenuProps} from "antdv-next";
import {createIcon} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {MenuInfo} from '@v-c/menu'

defineOptions({
  name: 'LAuthorityButton',
})

const principalStore = usePrincipalStore()

const props = withDefaults(
  defineProps<{
    authority?: CurdAuthorityProps,
    actionItems?: NonNullable<MenuProps['items']>
  }>(),
  {
    actionItems:() => []
  },
)

const emit = defineEmits<{
  add: []
  delete: []
  export: []
  actionItemClick: [e:MenuInfo]
}>()

const options = ref<{
  actionItems: NonNullable<MenuProps['items']>
}>({
  actionItems: [],
})

function handleActionClick(e: MenuInfo) {
  if (e.key === 'add') {
    emit('add')
  } else if (e.key === 'delete') {
    emit('delete')
  }else if (e.key === 'export') {
    emit('export')
  } else {
    emit('actionItemClick', e)
  }
}

function mounted() {
  options.value.actionItems = []

  if (principalStore.hasAnyPermission([props.authority?.save || '', props.authority?.export || '', props.authority?.delete || ''])) {

    const actionItems = [];
    if (principalStore.hasPermission(props.authority?.save || '')) {
      actionItems.push({
        key: 'add',
        label: '添加',
        icon: () => createIcon('icon-add', 'align'),
      })
    }
    if (principalStore.hasPermission(props.authority?.export || '')) {
      actionItems.push({
        key: 'export',
        label: '导出',
        icon: () => createIcon('icon-goods-start-to-ship', 'align'),
      })
    }
    if (principalStore.hasPermission(props.authority?.delete || '')) {
      actionItems.push({
        key: 'delete',
        label: '删除选中',
        icon: () => createIcon('icon-delete', 'align'),
      })
    }
    options.value.actionItems.push(...actionItems)
    if (props.actionItems.length > 0) {
      options.value.actionItems.push({type:'divider'});
      options.value.actionItems.push(...props.actionItems)
    }
  }
}

onMounted(mounted)

</script>

<template>
  <a-dropdown
    :trigger="['click']"
    placement="bottomRight"
    :menu="{ items: options.actionItems, onClick: handleActionClick }"
  >
    <a-button>
      <template #icon>
        <icon-font class="icon" type="icon-more"/>
      </template>
    </a-button>
  </a-dropdown>
</template>
