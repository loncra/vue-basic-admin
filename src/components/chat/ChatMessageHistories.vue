<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref, watch} from "vue";
import type {PageResult, RestResult, TotalPage, UserChatMessageResponseBody} from "@/types/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {AuthServerService} from "@/apis";
import {requireNonNullOrUndefined} from "@/utils";
import LChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";

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

const dataSource = ref<TotalPage<UserChatMessageResponseBody>>()
const loading = ref<boolean>(false)

async function loadHistories(number:number) {
  if (!props.roomId) {
    return ;
  }
  const pageRequest = {
    number:number,
    withoutReadableAnchor:true,
    totalPage:true
  }
  loading.value = true
  try {
    const result:RestResult<TotalPage<UserChatMessageResponseBody> | PageResult<UserChatMessageResponseBody>> = await ChatMessageService.histories(pageRequest, props.roomId)
    dataSource.value = (result.data || DEFAULT_PAGE_RESULT_VALUE) as TotalPage<UserChatMessageResponseBody>
  } finally {
    loading.value = false
  }
}

function onChangePage(page: number) {
  loadHistories(page)
}

onMounted(() => loadHistories(1))

watch(() => props.roomId, () => loadHistories(1))

</script>

<template>
  <a-flex vertical gap="middle">
    <a-input-search />
    <a-flex vertical v-if="dataSource" gap="middle" >
      <a-spin :spinning="loading">
        <a-flex vertical gap="middle" class="max-h-120 overflow-y-auto">
          <a-flex gap="middle" class="w-ful" v-for="data in dataSource.elements" :key="data.id">
            <l-user-avatar v-if="data.participant?.metadata?.details" :user="data.participant?.metadata?.details" size="large" />
            <a-flex vertical class="w-full">
              <a-flex>
                <a-typography-text strong class="flex-1">
                  {{AuthServerService.getPrincipalNameByPlatformUser(data.participant?.metadata?.details)}}
                </a-typography-text>
                <a-typography-text type="secondary">
                  {{globalProperties.$dayjs(data.creationTime).fromNow()}}
                </a-typography-text>
              </a-flex>
              <a-flex flex="1">
                <l-chat-message-bubble-content :content="data.content" />
              </a-flex>
            </a-flex>
          </a-flex>
        </a-flex>
        <a-pagination
          align="center"
          :page-size="dataSource?.size"
          :current="dataSource?.number"
          :total="dataSource?.totalCount"
          @change="onChangePage"
          hide-on-single-page
        />
      </a-spin>
    </a-flex>
    <a-empty v-else />
  </a-flex>
</template>
