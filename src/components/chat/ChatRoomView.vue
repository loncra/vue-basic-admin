<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance} from "vue";
import type {
  ContactItem,
  RestResult,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from "@/types/apis";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import LSystemUserPanel from "@/components/basic/SystemUserPanel.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {CHAAT_ROOM_VIEW_MODAL_TYPE} from "@/constants/messageConstant.ts";
import {AuthServerService} from "@/apis";
import LChatMessageHistories from "@/components/chat/ChatMessageHistories.vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {useChatContext, useChatRoomSettings} from "@/composables/chat";

defineOptions({
  name: 'LChatRoomView',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  contactDataSource:ContactItem[],
}>(),{

})

const principalStore = usePrincipalStore()
const {conversationActive} = useChatContext()

const emit = defineEmits<{
  addParticipant: [info: ContactItem[], restResult:RestResult<UserChatConversationResponseBody>],
  deleteConversation:[body:UserChatConversationResponseBody],
  historyClick:[data:UserChatMessageResponseBody]
}>()

const {
  conversation,
  participants,
  loading,
  options,
  modalOptions,
  systemUserPanelDataSource,
  onFilterSystemUser,
  confirmAddParticipant,
  onRename,
  onCancelRename,
  onPinnedChange,
  onMutedChange,
  onModalCancel,
  onAddParticipant,
  onMemberSetting,
  onOpenHistories,
  onHistoryClick,
  onUpdateParticipantType,
  onRemoveMember,
  onExist,
  onDisbandRoom,
} = useChatRoomSettings(
  () => conversationActive.value.item?.data,
  () => props.contactDataSource,
  {
    onAddParticipant: (info, result) => emit('addParticipant', info, result),
    onDeleteConversation: (body) => emit('deleteConversation', body),
    onHistoryClick: (data) => emit('historyClick', data),
  },
)

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
                  v-if="participants.some(c => getEnumValue(c.type) === 10 && principalStore.isCurrentPrincipal(c.principal)) && getEnumValue(conversation.status) === 10"
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
