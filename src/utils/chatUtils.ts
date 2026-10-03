import type {
  ParticipantMetadataMessageResponseBody,
  UserChatConversationResponseBody,
  UserChatMessageEntity
} from "@/types/apis";
import type {IdValueMetadata} from "@loncra/client/commons";
import type {PlatformUser, UserMetadata} from "@loncra/client/auth";
import type {FileObject, ObjectWriteResult} from "@loncra/client/resource";
import {AttachmentService} from "@loncra/client/resource";
import type {AvatarSize} from "antdv-next/dist/avatar/AvatarContext";
import {type ComponentInternalInstance, h, type VNode} from "vue";
import {Avatar, AvatarGroup, Tag} from "antdv-next";
import {AuthServerService} from "@/apis";
import type {
  InstructionBlock,
} from "@/types/composables";
import {AGENT_INSTRUCTION_PREFIX} from '@/constants';
import i18n from '@/i18n'
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {XProvider as AxConfigProvider} from "@antdv-next/x";
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {UserAvatar as LUserAvatar} from '@loncra/antdv-pro';
import {MESSAGE_SERVER_USER_CHAT_ROOM_TYPE} from '@loncra/client/message'
import {renderIconFont} from '@/utils/commonUtils'
import {getEnumName, getEnumValue} from "@loncra/client/commons"


const instructionIconMap:Record<string, string> = {
  "@":"loncra-at-sign",
  [AGENT_INSTRUCTION_PREFIX.MCP]:"loncra-plug-zap",
  [AGENT_INSTRUCTION_PREFIX.SKILL]:"loncra-sparkles",
}

export function createUserAvatarNode(
  user:PlatformUser | UserMetadata,
  size: AvatarSize = 'medium'
) {
  return h(
    LUserAvatar,
    {
      user,
      size
    },
  )
}

/**
 * 根据会话封面构建头像 VNode（多封面用 AvatarGroup，无封面回退首字母）。
 * 纯渲染函数，由会话列表 / 通知等场景复用。
 */
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

/*
 * `addBubbleListMessage` **已搬进 `@loncra/chat-core`**（2026-10-01 S2b-2，随 A1 一起）：
 * 它现在**只维护"业务体进列表"**（去重 + `hide`），**不再写 `content`、也不再做 system 拆条** ——
 * 渲染内容由 `toBubbleContent(item)` 现算（拆条在那里展开，顺手修掉了原先 fragment 共用一个 key 的真 bug）。
 * 消费方请从 `@loncra/chat-core` import。
 */

/** 会话列表最后一条消息预览 */
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
      for (const file of block.files || []) {
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

/** 会话列表草稿预览 */
export function getDraftContent(draft: SlotConfigType[] | undefined): string {
  if (!draft?.length) {
    return ''
  }
  return convertSlotConfigToText(draft)
}

/** Sender 词槽 -> 纯文本 */
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

export function getSendInstructionIcon(prefix:string, vnode?:boolean):string | undefined | VNode {
  const string = instructionIconMap[prefix]
  if (!string) {
    return string
  }

  if (!vnode) {
    return string;
  } else {
    return renderIconFont(string) ?? undefined
  }
}

/*
 * `isInstructionSlot` **已在规范包**（`@loncra/chat-core` 的 `slot.ts`，2026-10-01 S2a-1 落的）；
 * 宿主这份是重复实现，2026-10-01 收尾时删除 ⇒ 消费方改从 `@loncra/chat-core` import。
 * （core 的谓词多带一个 `key?: string`，正是为了消费方紧接着读 `slot.key`。）
 */

export function createInstructionSlot(
  slot:InstructionBlock,
  configProviderStore:ReturnType<typeof useConfigProviderStore>,
  currentInstance:ComponentInternalInstance,
): SlotConfigType {
  return {
    type: 'custom',
    key: slot.id,
    props: {slotKind: 'instruction', defaultValue: slot.value, prefix:slot.prefix},
    customRender:(
      value: IdValueMetadata<string, string>,
      onChange: (value: IdValueMetadata<string, string>) => void,
      _props: {disabled?: boolean; readOnly?: boolean},
      item: SlotConfigType,
    ) =>  instructionCustomRender(value, _props, item, configProviderStore, currentInstance),
  }
}

function instructionCustomRender(
  value: IdValueMetadata<string, string>,
  _props: {disabled?: boolean; readOnly?: boolean},
  item: SlotConfigType,
  configProviderStore:ReturnType<typeof useConfigProviderStore>,
  currentInstance:ComponentInternalInstance,
){
  const slotKey = 'key' in item && item.key ? item.key : ''
  const prefix = ((item as {props:Record<string, unknown>}).props as { prefix?: string })?.prefix ?? ''
  const iconType = getSendInstructionIcon(prefix, false) as string | undefined
  const node = h(
    AxConfigProvider,
    {
      // antdv 的 locale / 主题取自宿主那份配置实例；
      // （`XProvider` 的 props 里没有 `componentSize`，原来传了也是空转）
      locale: configProviderStore.antdvLocaleMessage(),
      theme: configProviderStore.antdv.themeConfig.value,
    },
    {
      default: () =>
        h(
          Tag,
          {
            key: slotKey,
            variant: 'outlined'
          },
          {
            icon: iconType ? () => renderIconFont(iconType) : undefined,
            default: () => value.value
          }
        ),
    },
  )
  node.appContext = currentInstance.appContext
  return node
}
