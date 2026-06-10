<script setup lang="ts">
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
  ref
} from "vue";
import type {IdValueMetadata, RestResult, UserChatMessageReadResponseBody} from "@/types/apis";
import {createIcon, dateTimeFormat, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {ChatMessageService} from "@/apis/message-server/chat/chatMessageService.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {AttachmentService} from "@/apis";
import type {TableProps} from "antdv-next";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {useSocketStore} from "@/stores/socketStore.ts";

defineOptions({
  name: 'LChatMessageReadTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const socketStore = useSocketStore()
const socketListener = ref<((() => void) | undefined)[]>([])

const props = withDefaults(defineProps<{
  messageId: number
}>(), {})

const activeValue = ref<string>('0')
const loading = ref<boolean>(false);

const segmented = computed(() =>{
  return [
    {
      label: '已读 (' + dataSource.value.filter((item) => getEnumValue(item.readable) === 0).length + ')',
      value: '0',
      icon: createIcon('loncra-eye', 'align')
    },
    {
      value: '1',
      label: '未读(' + dataSource.value.filter((item) => getEnumValue(item.readable) === 1).length + ')',
      icon: createIcon('loncra-eye-off', 'align')
    }
  ]
})

const dataSource = ref<UserChatMessageReadResponseBody[]>([])
const columns = computed(() => {
  const result:TableProps["columns"] = [
    {
      title: globalProperties.$t('common.name'),
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    }
  ]

  if (activeValue.value === '0') {
    result.push({
      title: globalProperties.$t('common.readTime'),
      dataIndex: 'readTime',
      key: 'readTime',
      width: 210,
      ellipsis: true
    })
  } else {
    result.push({
      title: globalProperties.$t('common.creationTime'),
      dataIndex: 'creationTime',
      key: 'creationTime',
      width: 210,
      ellipsis: true
    })
  }
  return result;
})

const filterDataSource = computed(() =>
  dataSource.value.filter((item) => getEnumValue(item.readable) === Number(activeValue.value))
)

function onChatMessageReadReceived(result: RestResult<IdValueMetadata<number, number>[]>) {
  if (!result.data) {
    return
  }

  for (const s of result.data) {
    const index = dataSource.value.findIndex(v => v.id === s.id)
    if (index < 0) {
      continue
    }
    const find = dataSource.value[index]
    if (!find) {
      continue
    }
    find.readable = {
      value:0,
      name:'已读'
    }
    find.readTime = s.value
  }

}

async function mounted() {
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE_READ_UPDATE,
    (payload) => onChatMessageReadReceived(parseSocketRestPayload<IdValueMetadata<number, number>[]>(payload))
  ))

  await loadingReadData()
}

async function loadingReadData() {
  try {
    loading.value = true
    const result:RestResult<UserChatMessageReadResponseBody[]> = await ChatMessageService.findMessageRead(props.messageId)
    dataSource.value = result?.data ||[]
  } finally {
    loading.value = false
  }
}

onMounted(mounted)
onUnmounted(() => socketListener.value.forEach(f => f?.()));

</script>

<template>
  <a-flex
    vertical
    gap="small"
    class="w-100"
  >
    <a-segmented
      v-model:value="activeValue"
      block
      :options="segmented"
      @change="(key:string )=> activeValue = key "
    >
      <template #iconRender="{ iconText }">
        <icon-font class="icon align" :type="iconText"/>
      </template>
    </a-segmented>
    <a-table
      :pagination="false"
      :loading="loading"
      size="small"
      :scroll="{x:'max-content', y: 350}"
      :columns="columns"
      :data-source="filterDataSource"
    >
      <template #bodyCell="{column, record }">
        <template v-if="column.key === 'name'">
          <a-space>
            <a-avatar
              :src="AttachmentService.getAvatarUrlIfNotNull(record.participant?.metadata?.details?.avatar)"
              v-if="principalStore.state.name !== record.principal"
              size="large"
            >
              {{ (record.participant?.metadata?.details?.realName || record.participant?.metadata?.details.useranme || globalProperties.$t('common.unname')).substring(0,1) }}
            </a-avatar>
            <a-avatar
              :src="principalStore.getAvatarUrl()"
              v-else
              size="large"
            >
              {{globalProperties.$t('common.me')}}
            </a-avatar>
            {{ record.participant?.metadata?.details?.realName || record.participant?.metadata?.details.useranme || globalProperties.$t('common.unname') }}
          </a-space>
        </template>
        <template v-if="column.key === 'readTime'">
          {{dateTimeFormat(record.readTime)}}
        </template>
        <template v-if="column.key === 'creationTime'">
          {{dateTimeFormat(record.creationTime)}}
        </template>
      </template>
    </a-table>
  </a-flex>
</template>
