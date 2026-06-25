<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, toRef} from "vue";
import type {UserChatMessageResponseBody} from "@/types/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {AuthServerService} from "@/apis";
import {requireNonNullOrUndefined} from "@/utils";
import LChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import LAttachmentMasonry from "@/components/basic/AttachmentMasonry.vue";
import {useChatHistories} from "@/composables/chat";

defineOptions({
  name: 'LChatMessageHistories',
})

const props = withDefaults(defineProps<{
  roomId:number
}>(),{

})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const emit = defineEmits<{
  click: [data: UserChatMessageResponseBody]
}>()

const {
  dataSource,
  loading,
  search,
  segmentedActive,
  segmentedData,
  fileOptions,
  computedFileDataSource,
  onChangePage,
  onSearch,
} = useChatHistories(toRef(props, 'roomId'))
</script>

<template>
  <a-flex vertical gap="middle">
    <a-space-compact>
      <a-input @press-enter="onSearch" v-model:value="search.content" />
      <a-range-picker v-model:value="search.date" show-time />
      <a-button @click="onSearch" :loading="loading">
        <template #icon>
          <icon-font type="loncra-calendar-search"/>
        </template>
      </a-button>
    </a-space-compact>
    <a-segmented
      v-model:value="segmentedActive"
      block
      :options="segmentedData"
      @change="(key:string )=> segmentedActive = key"

    >
      <template #iconRender="{ iconText }">
        <icon-font class="icon align" :type="iconText"/>
      </template>
    </a-segmented>
    <a-spin :spinning="loading">
      <a-flex vertical gap="middle" >
        <a-flex vertical gap="middle" class="max-h-100 min-h-0 overflow-y-auto">
          <template v-if="segmentedActive === 'message'" >
            <template v-if="dataSource && (dataSource.elements || []).length > 0">
              <a-flex gap="middle" class="w-ful hover:bg-layout p-xs group rounded-lg" v-for="data in dataSource.elements" :key="data.id">
                <l-user-avatar v-if="data.participant?.metadata?.details" :user="data.participant?.metadata?.details" size="large" />
                <a-flex vertical class="w-full">
                  <a-flex>
                    <a-typography-text strong class="flex-1">
                      {{ AuthServerService.getPrincipalNameByUserDetails(data.participant?.metadata?.details) }}
                    </a-typography-text>
                    <a-space>
                      <a-button
                        size="small"
                        @click="emit('click', data)"
                        type="text"
                        class="opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                      >
                        <template #icon>
                          <icon-font type="loncra-map-pin-search"/>
                        </template>
                        {{ globalProperties.$t('chat.roomView.histories.positioning') }}
                      </a-button>
                      <a-typography-text type="secondary">
                        {{globalProperties.$dayjs(data.creationTime).fromNow()}}
                      </a-typography-text>
                    </a-space>

                  </a-flex>
                  <div>
                    <l-chat-message-bubble-content :content="data.content" />
                  </div>
                </a-flex>
              </a-flex>
            </template>
            <a-empty v-else />
          </template>
          <template v-else>
            <template v-if="computedFileDataSource.length > 0">
              <div v-for="group in computedFileDataSource" :key="group.key">
                <a-divider orientation="left" plain>
                  <a-space>
                    <icon-font type="loncra-calendar-clock"/>
                    {{ group.key }}
                  </a-space>
                </a-divider>
                <l-attachment-masonry
                  bucket="temp"
                  :data-source="group.items"
                  :check-value="fileOptions.checkValue"
                />
              </div>
            </template>
            <a-empty v-else />
          </template>
        </a-flex>
        <a-pagination
          v-if="segmentedActive === 'message'"
          align="center"
          :page-size="dataSource?.size"
          :current="dataSource?.number"
          :total="dataSource?.totalCount"
          @change="onChangePage"
          hide-on-single-page
        />
      </a-flex>
    </a-spin>
  </a-flex>
</template>
