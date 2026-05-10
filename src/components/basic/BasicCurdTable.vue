<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {ref} from "vue";
import type {MenuItemType} from "antdv-next";
import {createIcon} from "@/utils";

defineOptions({
  name: 'LBasicCurdTable',
})

const operateItems = ref<MenuItemType[]>([
  {
    key: 'add',
    label: '添加',
    icon: () => createIcon('icon-add'),
  },
  {
    key: 'export',
    label: '导出',
    icon: () => createIcon('icon-goods-start-to-ship'),
  },
  {
    key: 'delete',
    label: '删除选中',
    icon: () => createIcon('icon-delete'),
  },
])

</script>

<template>
  <div>
    <l-menu-title-card>
      <template #extra>
        <a-dropdown
          :trigger="['click']"
          placement="bottomRight"
          :menu="{ items: operateItems }"
        >
          <a-button type="text">
            <icon-font class="icon" type="icon-more"></icon-font>
          </a-button>
        </a-dropdown>
      </template>
      <a-table v-bind="$attrs">

      </a-table>
    </l-menu-title-card>
  </div>
</template>
