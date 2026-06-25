import type {ObjectWriteResult, UserChatMessageEntity} from '@/types/apis'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import i18n from '@/i18n'

/**
 * 聊天内容格式化纯函数集合（从 ChatMessageService 视图职责中抽离）。
 * 无响应式状态/生命周期，内部使用 i18n.global.t（本身响应式），故以模块而非 use* hook 形式提供。
 */

/** 会话列表最后一条消息预览 */
export function getMessageContent(lastUserMessage: UserChatMessageEntity | undefined): string {
  if (!lastUserMessage) {
    return ''
  }
  let content = ''
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
