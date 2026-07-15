import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  nextTick,
  onMounted,
  type Ref,
  ref,
  watch,
} from 'vue'
import type {
  FilterRequest,
  ObjectItemInfo,
  PageResult,
  RestResult,
  TotalPage,
  UserChatMessageResponseBody,
} from '@/types/apis'
import {AttachmentService} from '@/apis'
import {ChatMessageService} from '@/apis/message-server/chatMessageService.ts'
import {createIcon, dateFormat, requireNonNullOrUndefined} from '@/utils'
import {DEFAULT_PAGE_RESULT_VALUE} from '@/constants/systemConstant.ts'
import {Dayjs} from 'dayjs'

/**
 * 历史消息弹窗逻辑：消息分页加载、附件资源加载、按类型/关键词/日期过滤分组、搜索与翻页。
 */
export function useChatHistories(roomId: Ref<number>) {
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const dataSource = ref<TotalPage<UserChatMessageResponseBody>>()
  const loading = ref<boolean>(false)
  const filterRequest = ref<FilterRequest>({})
  const search = ref<{
    content: string
    date: [Dayjs, Dayjs] | null
  }>({
    content: '',
    date: null,
  })
  const segmentedActive = ref<string>('message')

  const segmentedData = computed(() => [
    {
      label: globalProperties.$t('chat.history'),
      value: 'message',
      icon: createIcon('loncra-messages-square', 'align'),
    },
    {
      label: globalProperties.$t('attachment.type.image'),
      value: 'image',
      icon: createIcon('loncra-file-image', 'align'),
    },
    {
      value: 'video',
      label: globalProperties.$t('attachment.type.video'),
      icon: createIcon('loncra-file-video-camera', 'align'),
    },
    {
      value: 'audio',
      label: globalProperties.$t('attachment.type.audio'),
      icon: createIcon('loncra-file-volume', 'align'),
    },
    {
      value: 'unknown',
      label: globalProperties.$t('attachment.type.unknown'),
      icon: createIcon('loncra-file-text', 'align'),
    },
  ])

  const fileOptions = ref<{
    dataSource: ObjectItemInfo[]
    checkValue: ObjectItemInfo[]
  }>({
    dataSource: [],
    checkValue: [],
  })

  const computedFileDataSource = computed((): {key: string; items: ObjectItemInfo[]}[] => {
    let result = fileOptions.value.dataSource
    if (segmentedActive.value === 'video') {
      result = fileOptions.value.dataSource.filter((d) =>
        (d.userMetadata?.['content-type'] || '').startsWith('video/'),
      )
    } else if (segmentedActive.value === 'image') {
      result = fileOptions.value.dataSource.filter((d) =>
        (d.userMetadata?.['content-type'] || '').startsWith('image/'),
      )
    } else if (segmentedActive.value === 'audio') {
      result = fileOptions.value.dataSource.filter((d) =>
        (d.userMetadata?.['content-type'] || '').startsWith('audio/'),
      )
    }

    if (search.value.content !== '') {
      result = result.filter((d) =>
        (d.userMetadata?.['X-Amz-Meta-Original-Filename'] || d.objectName).includes(
          search.value.content,
        ),
      )
    }

    const range = search.value.date
    if (range?.[0] && range?.[1]) {
      const start = globalProperties.$dayjs(range[0]).valueOf()
      const end = globalProperties.$dayjs(range[1]).valueOf()
      result = result.filter((d) => d.lastModified >= start && d.lastModified <= end)
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
  })

  async function loadHistories(number: number): Promise<void> {
    if (!roomId.value) {
      return
    }
    const pageRequest = {
      ...filterRequest.value,
      number: number,
      withoutReadableAnchor: true,
      totalPage: true,
      'filter_[type_eq]': 10,
    }
    loading.value = true
    try {
      const result: RestResult<
        TotalPage<UserChatMessageResponseBody> | PageResult<UserChatMessageResponseBody>
      > = await ChatMessageService.histories(pageRequest, roomId.value)
      dataSource.value = (result.data ||
        DEFAULT_PAGE_RESULT_VALUE) as TotalPage<UserChatMessageResponseBody>
    } finally {
      loading.value = false
    }
  }

  async function loadFileResource(): Promise<void> {
    try {
      loading.value = true
      const result: RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(
        'temp',
        'user_chat_room/' + roomId.value,
      )
      fileOptions.value.dataSource = result.data || []
      fileOptions.value.dataSource.forEach((d) => (d.group = dateFormat(d.lastModified)))
    } finally {
      loading.value = false
    }
  }

  function onChangePage(page: number): void {
    loadHistories(page)
  }

  function onSearch(): void {
    if (loading.value) {
      return
    }
    if (segmentedActive.value === 'message') {
      filterRequest.value = {}
      if (search.value.content !== '') {
        filterRequest.value['filter_[content.*type_jin]'] = String('text')
        filterRequest.value['filter_[content.*value_jsa]'] = search.value.content
      }
      filterRequest.value['filter_[creation_time_between]'] = search.value.date
      loadHistories(1)
    }
  }

  function loadingDataSource(): void {
    loadHistories(1)
    loadFileResource()
  }

  onMounted(() => loadingDataSource())
  watch(() => roomId.value, () => loadingDataSource())
  watch(segmentedActive, async (key) => {
    if (key !== 'message') {
      await nextTick()
      window.dispatchEvent(new Event('resize'))
    }
  })

  return {
    dataSource,
    loading,
    search,
    segmentedActive,
    segmentedData,
    fileOptions,
    computedFileDataSource,
    onChangePage,
    onSearch,
  }
}

export type ChatHistoriesApi = ReturnType<typeof useChatHistories>
