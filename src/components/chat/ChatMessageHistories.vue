<script setup lang="ts">

import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
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
import {createIcon, dateFormat, requireNonNullOrUndefined} from "@/utils";
import LChatMessageBubbleContent from "@/components/chat/ChatMessageBubbleContent.vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";
import LAttachmentMasonry from "@/components/basic/AttachmentMasonry.vue";
import {Dayjs} from "dayjs";

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
const search = ref<{
  content:string,
  date:[Dayjs, Dayjs] | null
}>({
  content:'',
  date:null
})
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
  checkValue:[],
})

const emit = defineEmits<{
  click: [data: UserChatMessageResponseBody]
}>()

const computedFileDataSource = computed(():{key:string, items:ObjectItemInfo[]}[] => {
  let result = fileOptions.value.dataSource
  if (segmentedActive.value === 'video') {
    result = fileOptions.value.dataSource.filter(d => (d.userMetadata?.['content-type'] || '').startsWith('video/'))
  } else if (segmentedActive.value === 'image') {
    result = fileOptions.value.dataSource.filter(d => (d.userMetadata?.['content-type'] || '').startsWith('image/'))
  } else if (segmentedActive.value === 'audio') {
    result = fileOptions.value.dataSource.filter(d => (d.userMetadata?.['content-type'] || '').startsWith('audio/'))
  }

  if (search.value.content !== '') {
    result = result.filter(d => (d.userMetadata?.['X-Amz-Meta-Original-Filename'] || d.objectName).includes(search.value.content))
  }

  const range = search.value.date
  if (range?.[0] && range?.[1]) {
    const start = globalProperties.$dayjs(range[0]).valueOf()
    const end = globalProperties.$dayjs(range[1]).valueOf()
    result = result.filter(d => d.lastModified >= start && d.lastModified <= end)
  }

  // 先按 group 归并
  const grouped = [...result]
    .sort((a, b) => a.lastModified - b.lastModified)
    .reduce<Record<string, ObjectItemInfo[]>>((acc, it) => {
      const key = String(it.group ?? dateFormat(it.lastModified))
      ;(acc[key] ||= []).push(it)
      return acc
    }, {})
  // 再转成数组，并控制顺序
  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a)) // 分组：新日期在上
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => b.lastModified - a.lastModified), // 组内：新文件在上
    }))

});

async function loadHistories(number:number) {
  if (!props.roomId) {
    return ;
  }
  const pageRequest = {
    ...filterRequest.value,
    number:number,
    withoutReadableAnchor:true,
    totalPage:true,
    "filter_[type_eq]":10
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
    fileOptions.value.dataSource.forEach(d => d.group = dateFormat(d.lastModified))
  } finally {
    loading.value = false
  }
}

function onChangePage(page: number) {
  loadHistories(page)
}

function onSearch() {
  if (loading.value) {
    return
  }
  console.info(search.value.date)
  if (segmentedActive.value === 'message') {
    filterRequest.value = {}
    if (search.value.content !== '') {
      filterRequest.value["filter_[content.*type_jin]"] = String('text')
      filterRequest.value["filter_[content.*value_jsa]"] = search.value.content
    }
    filterRequest.value["filter_[creation_time_between]"] = search.value.date
    loadHistories(1)
  }
}

function loadingDataSource(){
  loadHistories(1)
  loadFileResource()
}

onMounted(() => loadingDataSource())

watch(() => props.roomId, () => loadingDataSource())
watch(segmentedActive, async (key) => {
  if (key !== 'message') {
    await nextTick()
    window.dispatchEvent(new Event('resize'))
  }
})
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
                  <a-flex flex="1" vertical>
                    <l-chat-message-bubble-content :content="data.content" />
                  </a-flex>
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
