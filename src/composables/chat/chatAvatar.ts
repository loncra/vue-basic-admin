import {h, type VNode} from 'vue'
import {Avatar, AvatarGroup} from 'antdv-next'
import type {AvatarSize} from 'antdv-next/dist/avatar/AvatarContext'
import type {FileObject} from '@/types/apis'
import {AttachmentService} from '@/apis'

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
