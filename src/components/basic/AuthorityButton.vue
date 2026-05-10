<script setup lang="ts">


import type {CurdAuthorityProps} from "@/types";
import {computed} from "vue";
import type {MenuProps} from "antdv-next";
import {createIcon} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {MenuInfo} from '@v-c/menu'
import {useI18n} from 'vue-i18n'

defineOptions({
  name: 'LAuthorityButton',
})

const principalStore = usePrincipalStore()
const {t, locale} = useI18n()

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

const menuItems = computed<NonNullable<MenuProps['items']>>(() => {
  locale.value
  const items: NonNullable<MenuProps['items']> = []

  if (!principalStore.hasAnyPermission([props.authority?.save || '', props.authority?.export || '', props.authority?.delete || ''])) {
    return items
  }

  if (principalStore.hasPermission(props.authority?.save || '')) {
    items.push({
      key: 'add',
      label: t('common.add'),
      icon: () => createIcon('icon-add', 'align'),
    })
  }
  if (principalStore.hasPermission(props.authority?.export || '')) {
    items.push({
      key: 'export',
      label: t('common.export'),
      icon: () => createIcon('icon-goods-start-to-ship', 'align'),
    })
  }
  if (principalStore.hasPermission(props.authority?.delete || '')) {
    items.push({
      key: 'delete',
      label: t('common.deleteSelected'),
      icon: () => createIcon('icon-delete', 'align'),
    })
  }

  if (props.actionItems.length > 0) {
    items.push({type: 'divider'})
    items.push(...props.actionItems)
  }

  return items
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

</script>

<template>
  <a-dropdown
    :trigger="['click']"
    placement="bottomRight"
    :menu="{ items: menuItems, onClick: handleActionClick }"
  >
    <a-button>
      <template #icon>
        <icon-font class="icon" type="icon-more"/>
      </template>
    </a-button>
  </a-dropdown>
</template>
