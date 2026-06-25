import type {UserChatMessageEntity} from '@/types/apis'
import type {ChatBubbleItem, ChatContentBlock, TextBlock} from '@/types/composables'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {CHAT_BUBBLE_TYPE} from '@/constants/messageConstant.ts'

/**
 * 将一条消息合入气泡列表（去重 + 系统消息拆条 + 头/尾插）。
 * 纯数组变换，无响应式依赖；由 useChatMessageLoader / useChatSocketEvents / 发送流程复用。
 */
export function addBubbleListMessage(
  body: UserChatMessageEntity,
  role: BubbleItemType['role'],
  bubbleList: ChatBubbleItem[],
  append: boolean = false,
  hide: boolean = false,
): void {
  const index = bubbleList.findIndex((b) => b.key === String(body.id))
  if (index >= 0) {
    bubbleList[index] = {
      key: String(body.id),
      role,
      content: body.content,
      data: body,
      hide,
    }
    return
  }

  const items =
    role === CHAT_BUBBLE_TYPE.SYSTEM
      ? body.content.map((c) => ({
          key: String(body.id),
          role,
          content: (c as TextBlock).value as unknown as ChatContentBlock,
          data: body,
          hide,
        }))
      : [
          {
            key: String(body.id),
            role,
            content: body.content,
            data: body,
            hide,
          },
        ]

  if (!append) {
    bubbleList.splice(0, 0, ...items)
  } else {
    bubbleList.push(...items)
  }
}
