import type {
  ParticipantMetadataMessageResponseBody,
  UserChatConversationResponseBody,
  UserChatMessageEntity
} from "@/types/apis";
import {getEnumName, getEnumValue} from "@loncra/client/commons"
import {AuthServerService, type PlatformUser, type UserMetadata} from "@loncra/client/auth";
import type {FileObject, ObjectWriteResult} from "@loncra/client/resource";
import {AttachmentService} from "@loncra/client/resource";
import type {AvatarSize} from "antdv-next/dist/avatar/AvatarContext";
import {h, type VNode} from "vue";
import {Avatar, AvatarGroup} from "antdv-next";
import i18n from '@/i18n'
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {UserAvatar} from '@loncra/antdv-pro';
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'

export function createUserAvatarNode(
  user:PlatformUser | UserMetadata,
  size: AvatarSize = 'medium'
) {
  return h(
    UserAvatar,
    {
      user,
      size
    },
  )
}

export function createAvatarNode(
  cover: FileObject[],
  defaultLabel: string,
  size: AvatarSize = 'medium',
  groupClass: string = '[&>*:not(:first-child)]:-ms-6!',
): VNode {
  const avatars: VNode[] = []
  for (const c of cover) {
    avatars.push(
      h(Avatar, {src: AttachmentService.query(c.bucketName, c.objectName), size}),
    )
  }
  if (avatars.length > 0) {
    return h(
      AvatarGroup,
      {
        max: {count: 3},
        size,
        class: groupClass ? groupClass : undefined,
      },
      {default: () => avatars},
    )
  }
  return h(Avatar, {size}, {default: () => defaultLabel.substring(0, 1)})
}

export function getMessageContent(lastUserMessage: UserChatMessageEntity | undefined, conversation?:UserChatConversationResponseBody): string {
  if (!lastUserMessage) {
    return ''
  }
  let content = ''
  if (conversation && getEnumValue(conversation.room.type) === MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT && (lastUserMessage as ParticipantMetadataMessageResponseBody).participant) {
    const p = (lastUserMessage as ParticipantMetadataMessageResponseBody).participant
    content += '[' + AuthServerService.getPrincipalNameByUserDetails(p.metadata.details) + ']: '
  }
  if (getEnumValue(lastUserMessage.undo)) {
    const principalStore = usePrincipalStore()
    if (principalStore.isCurrentPrincipal(lastUserMessage.principal)) {
      content += i18n.global.t('chat.view.selfUndo')
    } else {
      content += i18n.global.t('chat.view.undo.messageValue')
    }

    return content
  }
  for (const block of lastUserMessage.content) {
    if (block.type === 'text') {
      content += block.value || ''
    } else if (block.type === 'custom' && block.slotKind === 'files') {
      for (const file of block.value || []) {
        const contentType = file?.extraHeaders?.['Content-Type'] || ''
        if (contentType.startsWith('image/')) {
          content += '[' + i18n.global.t('attachment.type.image') + ']'
        } else if (contentType.startsWith('video/')) {
          content += '[' + i18n.global.t('attachment.type.video') + ']'
        } else if (contentType.startsWith('audio/')) {
          content += '[' + i18n.global.t('attachment.type.audio') + ']'
        } else {
          content += '[' + i18n.global.t('attachment.type.unknown') + ']'
        }
      }
    } else if (block.type === 'custom' && block.slotKind === 'instruction') {
      content += '[' + block.prefix + block.value.value + ']'
    } else if (block.type === 'custom' && block.slotKind === 'call') {
      content += '[' + getEnumName(block.value) + ', ' + getEnumName(block.status) + ']'
    }
  }
  return content
}

export function getDraftContent(draft: SlotConfigType[] | undefined): string {
  if (!draft?.length) {
    return ''
  }
  return convertSlotConfigToText(draft)
}

export function convertSlotConfigToText(slots: SlotConfigType[]): string {
  let result = ''
  for (const slot of slots) {
    result += slotConfigItemToText(slot)
  }
  return result
}

function slotConfigItemToText(slot: SlotConfigType): string {
  switch (slot.type) {
    case 'text':
      return slot.value ?? ''
    case 'input':
    case 'content': {
      const value = slot.props?.defaultValue
      if (value != null && value !== '') {
        return String(value)
      }
      const placeholder = slot.props?.placeholder
      return placeholder ? `[${placeholder}]` : ''
    }
    case 'select': {
      const value = slot.props?.defaultValue
      const options = slot.props?.options as Array<{label?: string; value?: string}> | undefined
      if (value != null && options?.length) {
        const matched = options.find((o) => o.value === value)
        if (matched?.label) {
          return String(matched.label)
        }
      }
      return value != null ? String(value) : ''
    }
    case 'tag':
      return slot.props?.label != null ? String(slot.props.label) : ''
    case 'custom':
      return customSlotToText(slot)
  }
}

function customSlotToText(slot: Extract<SlotConfigType, {type: 'custom'}>): string {
  const props = slot.props as Record<string, unknown> | undefined
  const slotKind = props?.slotKind
  if (slotKind === 'files') {
    const files = props?.defaultValue as UploadFile<ObjectWriteResult>[] | undefined
    return filesToTypeLabels(files)
  }
  if (slotKind === 'instruction') {
    const defaultValue = props?.defaultValue as {value?: unknown} | undefined
    const prefix = typeof props?.prefix === 'string' ? props.prefix : ''
    const text = defaultValue?.value == null ? '' : String(defaultValue.value)
    return prefix + text
  }
  return ''
}

function filesToTypeLabels(
  files: Array<ObjectWriteResult | UploadFile<ObjectWriteResult>> | undefined,
): string {
  if (!files?.length) {
    return ''
  }
  let result = ''
  for (const file of files) {
    result += fileToTypeLabel(file)
  }
  return result
}

function fileToTypeLabel(
  file: ObjectWriteResult | UploadFile<ObjectWriteResult> | undefined,
): string {
  const contentType =
    (file as ObjectWriteResult)?.extraHeaders?.['Content-Type'] ??
    (file as UploadFile<ObjectWriteResult>)?.type ??
    (file as UploadFile<ObjectWriteResult>)?.originFileObj?.type ??
    ''
  if (contentType.startsWith('image/')) {
    return `[${i18n.global.t('attachment.type.image')}]`
  }
  if (contentType.startsWith('video/')) {
    return `[${i18n.global.t('attachment.type.video')}]`
  }
  if (contentType.startsWith('audio/')) {
    return `[${i18n.global.t('attachment.type.audio')}]`
  }
  return `[${i18n.global.t('attachment.type.unknown')}]`
}

