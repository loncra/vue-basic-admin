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
  BasicUserChatConversation,
  ContactItem,
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity
} from "@/types/apis";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LSystemUserPanel from "@/components/basic/SystemUserPanel.vue";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.js";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import useApp from "antdv-next/dist/app/useApp";
import type {ChatRoomViewModalOpenType} from "@/types/composables";
import {CHAAT_ROOM_VIEW_MODAL_TYPE, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {useSocketStore} from "@/stores/socketStore.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import {AuthServerService} from "@/apis";
import LChatMessageHistories from "@/components/chat/ChatMessageHistories.vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";

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
const socketStore = useSocketStore()
const participants = ref<UserChatParticipantEntity[]>([])
const options = ref<{
  editName:boolean
  currentConversation?:UserChatConversationResponseBody
  selectedUser:ContactItem[]
}>({
  editName:false,
  selectedUser:[]
})

const modalOptions = ref<{
  open: boolean
  title?:string
  footer:boolean
  type?:ChatRoomViewModalOpenType
  confirmLoading?:boolean
}>({
  open:false,
  footer:true
})

const conversation = defineModel<UserChatConversationResponseBody>("conversation")

const socketListener = ref<((() => void) | undefined)[]>([])
const loading = ref<boolean>(false);

const emit = defineEmits<{
  addParticipant: [info: ContactItem[], restResult:RestResult<UserChatConversationResponseBody>],
  deleteConversation:[body:UserChatConversationResponseBody],
  historyClick:[data:UserChatMessageResponseBody]
}>()

const systemUserPanelDataSource = computed<ContactItem[]>(() => {
  if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT) {
    return props.contactDataSource
  }
  if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING) {
    return participants.value
      .filter(p => p.principal !== principalStore.state.name)
      .map(toContactItem)
  }
  return []
})

function toContactItem(p: UserChatParticipantEntity): ContactItem {
  return {
    key: String(p.metadata.details.id),
    label: String(AuthServerService.getPrincipalNameByUserDetails(p.metadata.details)),
    data: p.metadata.details,
    participantType:p.type
  }
}

function onChatParticipantRefreshByRoomId(restResult: RestResult<number>) {
  if (!options.value.currentConversation || !options.value.currentConversation?.room.id) {
    return
  }
  if (options.value.currentConversation?.room.id !== restResult.data) {
    return
  }
  loadParticipant()
}

async function mounted() {
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID,
    (payload) => onChatParticipantRefreshByRoomId(parseSocketRestPayload<number>(payload))
  ))
  if (!conversation.value) {
    return
  }
  if (options.value.currentConversation && options.value.currentConversation.id === conversation.value.id) {
    return
  }
  options.value.currentConversation = {...conversation.value}
  await loadParticipant()
}

async function loadParticipant() {
  if (!conversation.value || getEnumValue(conversation.value?.status) !== 10) {
    return
  }
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
  if (modalOptions.value.type === CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT) {
    return !participants.value.map(d => d.metadata.details.id).includes(item.data.id)
  }
  return true
}

async function confirmAddParticipant(){
  if (!conversation.value) {
    return
  }

  if (options.value.selectedUser.length <= 0 || !conversation.value.room?.id) {
    return
  }
  const principals = options.value.selectedUser.map(d => d.data).map(u => u.systemName)

  try {
    modalOptions.value.confirmLoading = true
    const result:RestResult<UserChatConversationResponseBody> = await ChatMessageService.addRoomParticipant(Number(conversation.value.room.id), principals)
    emit("addParticipant", options.value.selectedUser, result)
    onModalCancel()
  } finally {
    modalOptions.value.confirmLoading = false;
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

function onModalCancel() {
  modalOptions.value.open = false
  options.value.selectedUser = [];
}

function onAddParticipant() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }
  modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.ADD_PARTICIPANT
  modalOptions.value.title = globalProperties.$t("chat.roomView.addParticipant")
  modalOptions.value.open = true
  modalOptions.value.footer = true
}

function onMemberSetting() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }
  modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING
  modalOptions.value.title = globalProperties.$t("chat.roomView.memberManager")
  modalOptions.value.open = true
  modalOptions.value.footer = true
}

function onOpenHistories() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }

  modalOptions.value.type = CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES
  modalOptions.value.title = globalProperties.$t("chat.roomView.histories.title",{name:conversation.value.name})
  modalOptions.value.open = true
  modalOptions.value.footer = false
}

function onHistoryClick(data:UserChatMessageResponseBody) {
  emit('historyClick', data)
  onModalCancel()
}

async function onUpdateParticipantType(type:number) {
  const principals = options.value.selectedUser.map(d => d.data).map(u => u.systemName)
  if (principals.length <= 0) {
    return
  }

  if (!conversation.value || !conversation.value.room?.id) {
    return
  }

  try {
    modalOptions.value.confirmLoading = true
    const result:RestResult<void> = await ChatMessageService.updateParticipantType(conversation.value.room.id, type, principals)
    message.success(result.message)
    //await loadParticipant()
    onModalCancel()
  } finally {
    modalOptions.value.confirmLoading = false;
  }
}

async function onRemoveMember() {
  const principals = options.value.selectedUser.map(d => d.data).map(u => u.systemName)
  if (principals.length <= 0) {
    return
  }

  if (!conversation.value || !conversation.value.room?.id) {
    return
  }

  try {
    modalOptions.value.confirmLoading = true
    const result:RestResult<void> = await ChatMessageService.removeRoomParticipant(conversation.value.room.id, principals)
    message.success(result.message)
    await loadParticipant()
    onModalCancel()
  } finally {
    modalOptions.value.confirmLoading = false;
  }
}

function onExist() {

  if (!conversation.value) {
    return
  }

  if (getEnumValue(conversation.value.status) === 10) {
    modal.confirm({
      title: globalProperties.$t('chat.roomView.exitRoom.title'),
      content: globalProperties.$t('chat.roomView.exitRoom.content', {name: conversation.value.name}),
      onOk: () => doExist(),
    })
  } else {
    modal.confirm({
      title: globalProperties.$t('common.delete.confirmTitle'),
      content:globalProperties.$t('common.delete.confirmSingle'),
      onOk: () => doConversationDelete(conversation.value),
    })
  }

}

function onDisbandRoom() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }
  modal.confirm({
    title: globalProperties.$t('chat.roomView.disbandRoom.title'),
    content: globalProperties.$t('chat.roomView.disbandRoom.content', {name: conversation.value.name}),
    onOk: () => doDisbandRoom(),
  })
}

async function doDisbandRoom() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }
  try {
    loading.value = true
    const result:RestResult<void> = await ChatMessageService.disbandRoom(conversation.value.room.id)
    message.success(result.message)
  } finally {
    loading.value = false;
  }
}

async function doConversationDelete(body:UserChatConversationResponseBody | undefined) {
  if (!body) {
    return
  }
  try {
    const result:RestResult<void> = await ChatMessageService.deleteConversation([Number(body.id)])
    message.success(result.message)
    emit("deleteConversation",body)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

async function doExist() {
  if (!conversation.value || !conversation.value.room?.id) {
    return
  }
  try {
    loading.value = true
    const result:RestResult<void> = await ChatMessageService.existRoom(conversation.value.room.id)
    message.success(result.message)
  } finally {
    loading.value = false;
  }
}

onMounted(mounted)

watch(() => conversation.value, () => loadParticipant(), { deep: true })

</script>

<template>
  <a-flex vertical class="h-full min-h-0">
    <a-spin :spinning="loading" class="size-full-spin min-h-0">
      <template v-if="getEnumValue(conversation?.status) === 10">
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
              <l-user-avatar :user="c.metadata.details" size="large" shape="square" />
            </a-badge-ribbon>
            <span v-else>
              <l-user-avatar :user="c.metadata.details" size="large" shape="square" />
            </span>
            <a-typography-text :ellipsis="{tooltip:AuthServerService.getPrincipalNameByUserDetails(c?.metadata?.details)}">
              {{ AuthServerService.getPrincipalNameByUserDetails(c?.metadata?.details) }}
            </a-typography-text>
          </a-flex>

          <a-flex
            vertical
            justify="center"
            align="center"
            @click="onAddParticipant"
            class="w-12.5 cursor-pointer"
          >
            <a-avatar class="opacity-50" size="large" shape="square">
              <icon-font class="text-xl" type="loncra-user-round-plus" />
            </a-avatar>
            <a-typography-text>
              {{ globalProperties.$t('common.add') }}
            </a-typography-text>
          </a-flex>
        </a-flex>

      </template>
      <a-flex flex="1" class="h-full min-h-0" v-else justify="center" align="center">
        <a-empty />
      </a-flex>

      <a-flex vertical class="shrink-0">
        <a-divider />
        <a-button block type="text" @click="onOpenHistories">
          <template #icon>
            <icon-font type="loncra-calendar-clock"/>
          </template>
          {{ globalProperties.$t('chat.history') }}
        </a-button>
        <a-divider plain orientation="left" class="mt-xs mb-xs">
          <a-space>
            <icon-font type="loncra-settings-2" />
            <span>{{ globalProperties.$t('common.setting') }}</span>
          </a-space>
        </a-divider>
        <template v-if="conversation && conversation.room">

          <a-flex vertical gap="middle">
            <a-flex justify="space-between" align="center" v-if="getEnumValue(conversation.room.type) === 10" >
              <a-typography-text>
                {{ globalProperties.$t('common.name') }}
              </a-typography-text>
              <a-space v-if="!options.editName">
                <a-typography-text>
                  {{ conversation.name }}
                </a-typography-text>
                <a-button
                  v-if="participants.some(s => s.principal === principalStore.state.name && [10,20].includes(getEnumValue(s.type))) && getEnumValue(conversation.status) === 10"
                  size="small"
                  type="text"
                  @click="options.editName = true"
                >
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
            <template v-if="getEnumValue(conversation?.status) === 10">
              <a-flex justify="space-between" align="center" >
                <a-typography-text>
                  {{ globalProperties.$t('chat.pinned.action') }}
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
                  {{ globalProperties.$t('chat.muted.action') }}
                </a-typography-text>
                <a-switch
                  size="small"
                  :checked="getEnumValue(conversation.muted) === 1"
                  @change="onMutedChange"
                  :checked-children="globalProperties.$t('common.open')"
                  :un-checked-children="globalProperties.$t('common.close')"
                />
              </a-flex>
            </template>
            <template v-if="getEnumValue(conversation.room.type) === 10">
              <a-button
                block
                @click="onMemberSetting"
                v-if="participants.some(s => s.principal === principalStore.state.name && [10,20].includes(getEnumValue(s.type))) && getEnumValue(conversation.status) === 10">
                <template #icon>
                  <icon-font type="loncra-user-cog"/>
                </template>
                <span>
                  {{ globalProperties.$t('chat.roomView.memberManager') }}
                </span>
              </a-button>
              <a-space-compact block>
                <a-button block danger @click="onExist">
                  <template #icon>
                    <icon-font :type="getEnumValue(conversation.status) === 10 ? 'loncra-log-out' : 'loncra-archive-x'"/>
                  </template>
                  <span>
                    {{getEnumValue(conversation.status) === 10 ? globalProperties.$t('chat.roomView.exitRoom.action') : globalProperties.$t('chat.conversation.delete')}}
                  </span>
                </a-button>
                <a-button
                  type="primary"
                  block
                  danger
                  @click="onDisbandRoom"
                  v-if="participants.some(c => getEnumValue(c.type) === 10 && principalStore.state.name === c.principal) && getEnumValue(conversation.status) === 10"
                >
                  <template #icon>
                    <icon-font type="loncra-message-square-x"/>
                  </template>
                  <span>
                  {{ globalProperties.$t('chat.roomView.disbandRoom.action') }}
                </span>
                </a-button>
              </a-space-compact>
            </template>
          </a-flex>
        </template>
        <a-flex vertical gap="middle" v-else-if="conversation">
          <a-flex  justify="space-between" align="center">
            <a-typography-text>
              {{ globalProperties.$t('common.name') }}
            </a-typography-text>
            <a-typography-text>
              {{ conversation.name }}
            </a-typography-text>
          </a-flex>
          <a-button block danger @click="onExist">
            <template #icon>
              <icon-font type="loncra-archive-x"/>
            </template>
            <span>
              {{ globalProperties.$t('chat.conversation.delete') }}
            </span>
          </a-button>
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
      :footer="modalOptions.footer ? true : null"
      :open="modalOptions.open"
      :title="modalOptions.title"
      @cancel="onModalCancel()"
      @ok="confirmAddParticipant()"
      :confirm-loading="modalOptions.confirmLoading"
    >
      <l-chat-message-histories
        v-if="conversation && modalOptions.type === CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES"
        @click="onHistoryClick"
        :room-id="Number(conversation.room.id)"
      />
      <l-system-user-panel v-else v-model:value="options.selectedUser" :filter="onFilterSystemUser" :data-source="systemUserPanelDataSource" />

      <template
        #footer="{extra}"
        v-if="modalOptions.type !== CHAAT_ROOM_VIEW_MODAL_TYPE.HISTORIES"
      >
        <a-space>
          <a-space-compact v-if="modalOptions.type === CHAAT_ROOM_VIEW_MODAL_TYPE.MEMBER_SETTING">
            <a-button @click="onUpdateParticipantType(30)" :loading="modalOptions.confirmLoading" :disabled="options.selectedUser.filter(s => getEnumValue(s.participantType) === 20).length <= 0">
              {{ globalProperties.$t('chat.roomView.modal.changeMember') }}
            </a-button>
            <a-button @click="onUpdateParticipantType(20)" :loading="modalOptions.confirmLoading" :disabled="options.selectedUser.filter(s => getEnumValue(s.participantType) === 30).length <= 0">
              {{ globalProperties.$t('chat.roomView.modal.changeCoOwner') }}
            </a-button>
            <a-popconfirm
              :ok-button-props="{ loading: modalOptions.confirmLoading }"
              :title="globalProperties.$t('chat.roomView.modal.removeMember.confirmTitle')"
              :description="globalProperties.$t('chat.roomView.modal.removeMember.content',{count:options.selectedUser.length})"
              @confirm="onRemoveMember()"
            >
              <a-button :loading="modalOptions.confirmLoading" :disabled="options.selectedUser.length <= 0" type="primary" danger>
                {{ globalProperties.$t('chat.roomView.modal.removeMember.action') }}
              </a-button>
            </a-popconfirm>
          </a-space-compact>
          <component v-else :is="extra.OkBtn" />
          <component :is="extra.CancelBtn" />
        </a-space>
      </template>
    </a-modal>
  </a-flex>
</template>
