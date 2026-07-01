<script setup lang="ts">

import emojiGroups from "unicode-emoji-json/data-by-group.json";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LEmojiButton',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const emojiOptions = ref<{
  activeKey: string
  open: boolean
}>({
  activeKey: 'smileys_emotion',
  open: false
})

const emit = defineEmits<{
  selected: [emoji: string]
}>()

function onSelectedEmoji(emoji: string) {
  emojiOptions.value.open = false
  emit('selected', emoji)
}

</script>

<template>
  <a-popover trigger="click" v-model:open="emojiOptions.open">
    <template #content>
      <div class="w-100">
        <a-tabs
          :active-key="emojiOptions.activeKey"
          :items="emojiGroups.filter(r => !['people_body','symbols', 'flags'].includes(r.slug)).map(e => ({key:e.slug, label:globalProperties.$t('chat.emoji.' + e.slug)}))"
          @change="(key:string )=> emojiOptions.activeKey = key "
        >
          <template #contentRender="{item}">
            <div class="max-h-80 overflow-auto">
              <a-card size="small">
                <a-card-grid
                  class="cursor-pointer p-0 w-1/11 text-center pt-xs pb-xs "
                  :key="v.name"
                  v-for="v of emojiGroups.find(e => e.slug === item.key)?.emojis || []"
                  @click="onSelectedEmoji(v.emoji)"
                >
                          <span class="text-2xl leading-none">
                            {{ v.emoji }}
                          </span>
                </a-card-grid>
              </a-card>
            </div>
          </template>
        </a-tabs>
      </div>
    </template>

    <a-button v-bind="$attrs">
      <template #icon>
        <icon-font type="loncra-smile"/>
      </template>
    </a-button>
  </a-popover>
</template>
