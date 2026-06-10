<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref, watch} from "vue";
import type {
  BasicUserChatConversation,
  ContactItem,
  PlatformUser,
  RestResult,
  UserChatConversationResponseBody,
  UserChatParticipantEntity
} from "@/types/apis";
import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LSystemUserPanel from "@/components/basic/SystemUserPanel.vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'LChatRoomView',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message, modal} = useApp()

const props = withDefaults(defineProps<{
  contactDataSource:ContactItem[],
}>(),{

})

const principalStore = usePrincipalStore()
const participants = ref<UserChatParticipantEntity[]>([])
const options = ref<{
  modalOpen: boolean
  confirmLoading:boolean
  editName:boolean
  currentConversation?:UserChatConversationResponseBody
  selectedUser:PlatformUser[]
}>({
  modalOpen: false,
  confirmLoading:false,
  editName:false,
  selectedUser:[]
})

const conversation = defineModel<UserChatConversationResponseBody>("conversation")

const loading = ref<boolean>(false);

const emit = defineEmits<{
  confirm: [info: PlatformUser[], restResult:RestResult<UserChatConversationResponseBody>]
}>()

async function mounted() {
  if (!conversation.value) {
    return
  }
  if (options.value.currentConversation && options.value.currentConversation.id === conversation.value.id) {
    return
  }
  options.value.currentConversation = {...conversation.value}
  try {
    loading.value = true
    const result:RestResult<UserChatParticipantEntity[]> = await ChatMessageService.findRoomParticipant(Number(conversation.value.room.id))
    if (result.data) {
      participants.value = result.data
    }
  } finally {
    loading.value = false
  }
}

function onFilterSystemUser(item:ContactItem) {
  return !participants.value.map(d => d.metadata.details.id).includes(item.data.id)
}

async function onModalOk(){
  if (!conversation.value) {
    return
  }

  if (options.value.selectedUser.length <= 0 || !conversation.value.room?.id) {
    return
  }

  try {
    options.value.confirmLoading = true
    const result:RestResult<UserChatConversationResponseBody> = await ChatMessageService.addRoomParticipant(Number(conversation.value.room.id), options.value.selectedUser.map(u => u.systemName))
    emit("confirm", options.value.selectedUser, result)
    options.value.modalOpen = false
  } finally {
    options.value.confirmLoading = false;
  }
}

async function onRename() {
  if (!options.value.currentConversation) {
    return
  }
  try {
    loading.value = true
    const result:RestResult<void> = await ChatMessageService.roomRename(Number(options.value.currentConversation.room.id), String(options.value.currentConversation.name))
    message.success(result.message)
    options.value.editName = false
  } finally {
    loading.value = false;
  }
}

function onCancelRename() {
  if (!conversation.value || !options.value.currentConversation) {
    return
  }
  options.value.currentConversation.name = conversation.value.name
  options.value.editName = false
}

async function onPinnedChange() {
  if (!conversation.value) {
    return
  }
  try {
    loading.value = true
    const result:RestResult<BasicUserChatConversation[]> = await ChatMessageService.pinnedConversation([Number(conversation.value.id)])
    if (!result.data || result?.data.length <= 0) {
      return
    }
    const c:BasicUserChatConversation = result?.data?.at(0) as BasicUserChatConversation
    if (c) {
      conversation.value.pinned = c.pinned
    }
  } finally {
    loading.value = false;
  }
}

async function onMutedChange() {
  if (!conversation.value) {
    return
  }
  try {
    loading.value = true
    const result:RestResult<BasicUserChatConversation[]> = await ChatMessageService.mutedConversation([Number(conversation.value.id)])
    if (!result.data || result?.data.length <= 0) {
      return
    }
    const c:BasicUserChatConversation = result?.data?.at(0) as BasicUserChatConversation
    if (c) {
      conversation.value.muted = c.muted
    }
  } finally {
    loading.value = false;
  }
}

onMounted(mounted)

watch(() => conversation.value, () => mounted(), { deep: true })

</script>

<template>
  <a-flex vertical class="h-full min-h-0">
    <a-spin :spinning="loading" class="size-full-spin min-h-0">
      <a-flex class="shrink-0 mb-sm" v-if="getEnumValue(conversation?.room?.type) === 10">
        <a-input-search  />
      </a-flex>
      <a-flex flex="1" class="h-full min-h-0 overflow-y-auto" wrap="wrap" gap="small" justify="flex-start" align="flex-start">
        <a-flex
          vertical
          justify="center"
          align="center"
          class="w-12.5 relative"
          v-for="c in participants"
          :key="c.id"
        >

          <a-badge-ribbon :color="getEnumValue(c.type) === 10 ? 'gold' : 'yellow'" class="text-xs top-0 opacity-80" v-if="[10,20].includes(getEnumValue(c.type))" :text="getEnumName(c.type)">
            <a-avatar
              size="large"
              shape="square"
              v-if="c.metadata.details.avatar"
              :src="AttachmentService.query(c.metadata.details.avatar.bucketName, c.metadata.details.avatar.objectName)"
            />
            <a-avatar size="large" shape="square" v-else>
              {{ String(c.metadata?.details?.realName || c.metadata?.details?.username || globalProperties.$t('common.unname')).substring(0,1) }}
            </a-avatar>
          </a-badge-ribbon>
          <span v-else>
          <a-avatar
            size="large"
            shape="square"
            v-if="c.metadata.details.avatar"
            :src="AttachmentService.query(c.metadata.details.avatar.bucketName, c.metadata.details.avatar.objectName)"
          />
          <a-avatar size="large" shape="square" v-else>
            {{ String(c.metadata?.details?.realName || c.metadata?.details?.username || globalProperties.$t('common.unname')).substring(0,1) }}
          </a-avatar>
        </span>
          <a-typography-text :ellipsis="{tooltip:String(c.metadata?.details?.realName || c.metadata?.details?.username || globalProperties.$t('common.unname'))}">
            {{String(c.metadata?.details?.realName || c.metadata?.details?.username || globalProperties.$t('common.unname'))}}
          </a-typography-text>
        </a-flex>

        <a-flex
          vertical
          justify="center"
          align="center"
          @click="options.modalOpen = true"
          class="w-12.5 cursor-pointer"
        >
          <a-avatar class="opacity-50" size="large" shape="square">
            <icon-font class="text-xl" type="loncra-user-round-plus" />
          </a-avatar>
          <a-typography-text>
            添加
          </a-typography-text>
        </a-flex>
      </a-flex>
      <a-flex vertical class="shrink-0">
        <a-divider />
        <a-button block type="text">
          <template #icon>
            <icon-font type="loncra-calendar-clock"/>
          </template>
          聊天记录
        </a-button>
        <a-divider plain orientation="left">
          <a-space>
            <icon-font type="loncra-settings-2" />
            <span>设置</span>
          </a-space>
        </a-divider>
        <a-flex vertical gap="small" v-if="conversation">
          <a-flex justify="space-between" align="center" >
            <a-typography-text>
              名称
            </a-typography-text>
            <a-space v-if="!options.editName">
              <a-typography-text>
                {{ conversation.name }}
              </a-typography-text>
              <a-button size="small" type="text" @click="options.editName = true">
                <template #icon>
                  <icon-font type="loncra-pencil" />
                </template>
              </a-button>
            </a-space>
            <a-space-compact v-else-if="options.currentConversation">
              <a-input @press-enter="onRename" :max-length="16" size="small" v-model:value="options.currentConversation.name" />
              <a-button size="small" @click="onCancelRename">
                <icon-font type="loncra-message-circle-x"/>
              </a-button>
              <a-button size="small" type="primary" @click="onRename">
                <icon-font type="loncra-message-circle-check"/>
              </a-button>
            </a-space-compact>
          </a-flex>
          <a-flex justify="space-between" align="center" >
            <a-typography-text>
              置顶聊天
            </a-typography-text>
            <a-switch
              size="small"
              :checked="getEnumValue(conversation.pinned) === 1"
              @change="onPinnedChange"
              :checked-children="globalProperties.$t('common.open')"
              :un-checked-children="globalProperties.$t('common.close')"
            />
          </a-flex>
          <a-flex justify="space-between" align="center" >
            <a-typography-text>
              消息免打扰
            </a-typography-text>
            <a-switch
              size="small"
              :checked="getEnumValue(conversation.muted) === 1"
              @change="onMutedChange"
              :checked-children="globalProperties.$t('common.open')"
              :un-checked-children="globalProperties.$t('common.close')"
            />
          </a-flex>
          <template v-if="getEnumValue(conversation.room.type) === 10">
            <a-space-compact block v-if="participants.some(c => getEnumValue(c.type) === 10 && principalStore.state.name === c.principal)">
              <a-button block>
                <template #icon>
                  <icon-font type="loncra-arrow-right-left"/>
                </template>
                <span>
                转让群主
              </span>
              </a-button>
              <a-button block>
                <template #icon>
                  <icon-font type="loncra-user-key"/>
                </template>
                <span>
                设置管理员
              </span>
              </a-button>
            </a-space-compact>
            <a-button block danger>
              <template #icon>
                <icon-font type="loncra-log-out"/>
              </template>
              <span>
              退出群聊
            </span>
            </a-button>
            <a-button type="primary" block danger v-if="participants.some(c => getEnumValue(c.type) === 10 && principalStore.state.name === c.principal)">
              <template #icon>
                <icon-font type="loncra-message-square-x"/>
              </template>
              <span>
              解散群聊
            </span>
            </a-button>
          </template>
        </a-flex>
      </a-flex>
    </a-spin>
    <a-modal
      :width="{
        xs: '90%',
        sm: '80%',
        md: '70%',
        lg: '60%',
        xl: '60%',
        xxl: '60%',
      }"
      :open="options.modalOpen"
      title="发起群聊"
      @cancel="options.modalOpen = false"
      @ok="onModalOk"
      :confirm-loading="options.confirmLoading"
    >
      <l-system-user-panel v-model:value="options.selectedUser" :filter="onFilterSystemUser" :data-source="props.contactDataSource" />
    </a-modal>
  </a-flex>
</template>
