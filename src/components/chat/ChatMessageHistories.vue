<script setup lang="ts">

import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  watch
} from "vue";
import type {
  FilterRequest,
  ObjectItemInfo,
  PageResult,
  RestResult,
  TotalPage,
  UserChatMessageResponseBody
} from "@/types/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {AttachmentService, AuthServerService} from "@/apis";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import LChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";
import LAttachmentMasonry from "@/components/basic/AttachmentMasonry.vue";

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
const filterRequest = ref<FilterRequest>({})

const segmentedActive = ref<string>('message')
const segmentedData = computed(() =>{
  return [
    {
      label: globalProperties.$t('chat.history'),
      value: 'message',
      icon: createIcon('loncra-messages-square', 'align')
    },
    {
      label: globalProperties.$t('attachment.type.image'),
      value: 'image',
      icon: createIcon('loncra-file-image', 'align')
    },
    {
      value: 'video',
      label: globalProperties.$t('attachment.type.video'),
      icon: createIcon('loncra-file-video-camera', 'align')
    },
    {
      value: 'audio',
      label: globalProperties.$t('attachment.type.audio'),
      icon: createIcon('loncra-file-volume', 'align')
    },
    {
      value: 'unknown',
      label: globalProperties.$t('attachment.type.unknown'),
      icon: createIcon('loncra-file-text', 'align')
    }
  ]
})

const fileOptions = ref<{
  dataSource:ObjectItemInfo[],
  checkValue:ObjectItemInfo[],
}>({
  dataSource:[],
  checkValue:[]
})

const emit = defineEmits<{
  click: [data: UserChatMessageResponseBody]
}>()

async function loadHistories(number:number) {
  if (!props.roomId) {
    return ;
  }
  const pageRequest = {
    ...filterRequest.value,
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

async function loadFileResource(){
  try {
    loading.value = true;
    const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment('temp', 'user_chat_room/' + props.roomId)
    fileOptions.value.dataSource = result.data || []
  } finally {
    loading.value = false
  }
}

function onChangePage(page: number) {
  loadHistories(page)
}

function onSearch(value: string) {
  if (value !== '') {
    filterRequest.value["filter_[content.*type_jin]"] = String('text');
    filterRequest.value["filter_[content.*value_jin]"] = value;
  } else {
    delete filterRequest.value["filter_[content.*type_jin]"];
    delete filterRequest.value["filter_[content.*value_jin]"];
  }
  loadHistories(1)
}

function loadingDataSource(){
  loadHistories(1)
  loadFileResource()
}

onMounted(() => loadingDataSource())

watch(() => props.roomId, () => loadingDataSource())

</script>

<template>
  <a-flex vertical gap="middle">
    <a-input-search @search="onSearch" />
    <a-segmented
      v-model:value="segmentedActive"
      block
      :options="segmentedData"
      @change="(key:string )=> segmentedActive = key "

    >
      <template #iconRender="{ iconText }">
        <icon-font class="icon align" :type="iconText"/>
      </template>
    </a-segmented>
    <a-spin :spinning="loading">
      <a-flex vertical v-if="dataSource && (dataSource.elements || []).length > 0" gap="middle" >
        <a-flex vertical gap="middle" class="max-h-100 overflow-y-auto">
          <template v-if="segmentedActive === 'message'" >
            <a-flex gap="middle" class="w-ful hover:bg-layout p-xs group rounded-lg" v-for="data in dataSource.elements" :key="data.id">
            <l-user-avatar v-if="data.participant?.metadata?.details" :user="data.participant?.metadata?.details" size="large" />
            <a-flex vertical class="w-full">
              <a-flex>
                <a-typography-text strong class="flex-1">
                  {{AuthServerService.getPrincipalNameByPlatformUser(data.participant?.metadata?.details)}}
                </a-typography-text>
                <a-space>
                  <a-button
                    @click="emit('click', data)"
                    type="text"
                    size="small"
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
              <a-flex flex="1">
                <l-chat-message-bubble-content :content="data.content" />
              </a-flex>
            </a-flex>
          </a-flex>
          </template>
          <template v-else>
            <l-attachment-masonry bucket="temp" v-model:data-source="fileOptions.dataSource" :check-value="fileOptions.checkValue" />
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
      <a-empty v-else />
    </a-spin>
  </a-flex>
</template>
