<script setup lang="ts">

import {useFileEditor} from '@/composables'
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {ObjectWriteResult} from "@/types/apis";

defineOptions({
  name: 'LFileEditor',
})

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    name?: string
    path: string
    getIcon?: (item: UploadFile<ObjectWriteResult>) => string
  }>(),
  {
    readonly: false,
  },
)


const {
  resolveIcon,
  state
} = useFileEditor(props)

</script>

<template>
  <a-splitter class="h-120 rounded-lg max-h-180 border border-border-secondary">
    <a-splitter-panel class="min-h-0 h-full" default-size="20%" min="10%" max="30%">
      <a-flex
        gap="small"
        justify="space-between"
        align="center"
        class="w-full p-xs border-b border-border-secondary"
      >
        <a-flex flex="1" gap="small" align="center">
          <icon-font class="icon" type="loncra-sparkles" />
          <a-typography-text ellipsis>
            <template v-if="props.name">{{props.name}}</template>
            <template v-else>{{$t('common.unname')}}</template>
          </a-typography-text>
        </a-flex>
      </a-flex>
      <a-menu
        class="border-none folder-edit flex-1"
        mode="inline"
      >
        <template #iconRender="item">
          <icon-font :type="resolveIcon(item)" />
        </template>
        <template #labelRender="item">

          <a-flex
            class="group min-w-0 w-full"
            justify="space-between"
            align="center"
          >
            <a-typography-text
              class="min-w-0 flex-1"
              :ellipsis="{ tooltip: {title:item.name, mouseEnterDelay: 1}}"
            >
              {{ item.label }}
            </a-typography-text>
<!--            <span class="relative inline-flex shrink-0 items-center justify-end" v-if="!item.readonly">
              <a-dropdown
                :menu="createMenu(item)"
              >
                <a-button
                  type="text"
                  size="small"
                  class="absolute opacity-0 transition-opacity duration-300 group-hover:static group-hover:opacity-100"
                  @click.stop
                  @mousedown.stop
                >
                  <template #icon>
                    <icon-font type="loncra-ellipsis"/>
                  </template>
                </a-button>
              </a-dropdown>
            </span>-->
          </a-flex>
        </template>
      </a-menu>
    </a-splitter-panel>
    <a-splitter-panel class="min-h-0 size-full">
      <a-flex
        v-if="state.selectedItem"
        vertical
        class="min-h-0 h-full overflow-hidden"
      >
        <a-flex
          justify="space-between"
          align="center"
          class="shrink-0 w-full p-xs border-b border-border-secondary"
        >
          <a-flex flex="1" gap="small" align="center">
            <icon-font :type="resolveIcon(state.selectedItem)" />
            <a-typography-text ellipsis>{{state.selectedItem.name}}</a-typography-text>
          </a-flex>
        </a-flex>
        <a-flex flex="1" class="size-full p-xs" >
        </a-flex>
      </a-flex>
      <a-flex v-else class="size-full" align="center" justify="center">
        <a-empty />
      </a-flex>
    </a-splitter-panel>
  </a-splitter>

</template>
