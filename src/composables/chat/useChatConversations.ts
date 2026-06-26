import {computed, type Ref, ref} from 'vue'
import type {UserChatConversationResponseBody} from '@/types/apis'
import {getEnumValue} from '@/utils'

/**
 * 会话列表状态与变更集中管理。
 * 取代 MyChatMessage 中散落的列表增删改（发送置顶 / 选联系人 / 删除 / socket 新建 / 刷新）
 * 与 ChatConversation 的排序逻辑。
 */
export function useChatConversations() {
  // 显式断言为 Ref<T>，避免 ref<T>() 的 UnwrapRef 对复杂嵌套类型做深度递归（TS2589）
  const dataSource = ref<UserChatConversationResponseBody[]>([]) as Ref<
    UserChatConversationResponseBody[]
  >

  function isPinned(item: UserChatConversationResponseBody): boolean {
    return getEnumValue(item.pinned) === 1
  }

  function getConversationActiveTime(item: UserChatConversationResponseBody): number {
    return item.lastUserMessage?.creationTime ?? item.creationTime ?? 0
  }

  function compareConversations(
    a: UserChatConversationResponseBody,
    b: UserChatConversationResponseBody,
  ): number {
    const aPinned = isPinned(a)
    const bPinned = isPinned(b)
    // 1. 置顶优先
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1
    }
    // 2. 同为置顶 -> pinnedTime 降序
    if (aPinned && bPinned) {
      return (b.pinnedTime ?? 0) - (a.pinnedTime ?? 0)
    }
    // 3. 非置顶 -> 活跃时间降序
    return getConversationActiveTime(b) - getConversationActiveTime(a)
  }

  const sortedDataSource = computed<UserChatConversationResponseBody[]>(() =>
    [...dataSource.value].sort(compareConversations),
  )

  function findById(id: number | undefined): UserChatConversationResponseBody | undefined {
    if (id == null) {
      return undefined
    }
    return dataSource.value.find((d) => d.id === id)
  }

  function findByRoomId(
    roomId: number | undefined,
  ): UserChatConversationResponseBody | undefined {
    if (roomId == null) {
      return undefined
    }
    return dataSource.value
      .filter(d => d?.room?.id)
      .find((d) => d.room.id === roomId)
  }

  /** 整体替换（首屏 / 全量刷新），并为缺省 draft 补空数组 */
  function setAll(list: UserChatConversationResponseBody[]): void {
    list.filter((d) => !d.draft).forEach((d) => (d.draft = []))
    dataSource.value = [...list]
  }

  /** 按 id upsert 并置顶，返回最终置顶的会话 */
  function upsertToTop(
    body: UserChatConversationResponseBody,
  ): UserChatConversationResponseBody {
    const exist = findById(body.id)
    const target = exist ?? body
    dataSource.value = [target, ...dataSource.value.filter((d) => d.id !== body.id)]
    return target
  }

  /** 按 room.id 找到会话并置顶（可选先变更其属性），常用于本端/对端新消息 */
  function moveToTopByRoomId(
    roomId: number | undefined,
    mutate?: (conversation: UserChatConversationResponseBody) => void,
  ) {
    const find = findByRoomId(roomId)
    if (!find) {
      return
    }
    mutate?.(find)
    dataSource.value = [find, ...dataSource.value.filter((d) => d.room.id !== roomId)]

  }

  /** 不存在时头插（socket 新建会话推送） */
  function unshiftIfAbsent(body: UserChatConversationResponseBody): void {
    if (dataSource.value.some((c) => c.id === body.id)) {
      return
    }
    dataSource.value.unshift(body)
  }

  /** 按 room.id 替换整条会话，返回替换后的会话 */
  function replaceByRoomId(
    roomId: number,
    body: UserChatConversationResponseBody,
  ): UserChatConversationResponseBody | undefined {
    const index = dataSource.value
      .filter(d => d?.room?.id)
      .findIndex((s) => s.room.id === roomId)
    if (index < 0) {
      return undefined
    }
    dataSource.value[index] = body
    return dataSource.value[index]
  }

  function remove(id: number | undefined): void {
    dataSource.value = dataSource.value.filter((d) => d.id !== id)
  }

  /** 局部同步置顶/免打扰状态（来自批量接口返回） */
  function patchFlags(
    items: Array<{id?: number; pinned?: unknown; muted?: unknown}>,
  ): void {
    for (const c of items) {
      const data = findById(c.id)
      if (!data) {
        continue
      }
      if (c.pinned !== undefined) {
        data.pinned = c.pinned as UserChatConversationResponseBody['pinned']
      }
      if (c.muted !== undefined) {
        data.muted = c.muted as UserChatConversationResponseBody['muted']
      }
    }
  }

  return {
    dataSource,
    sortedDataSource,
    isPinned,
    compareConversations,
    findById,
    findByRoomId,
    setAll,
    upsertToTop,
    moveToTopByRoomId,
    unshiftIfAbsent,
    replaceByRoomId,
    remove,
    patchFlags,
  }
}

export type ChatConversationsApi = ReturnType<typeof useChatConversations>
