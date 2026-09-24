import type {AvatarProps} from 'antdv-next'
import type {VNode} from '@loncra/antdv'
import {type FormatContext, iconNameCell, type ValueFormatter} from '@loncra/antdv-pro'
import {renderIconFont} from '@/utils/commonUtils'

/**
 * 宿主注册给 CRUD DSL 的 **formatter 表**（`<l-provider :formatters="…">`
 * → `CrudConfigProvider` → 按 key 覆盖 pro 的内置表）。
 *
 * 声明里写 `format: 'iconName'`，或带参数 `format: {name: 'iconName', args: {size: 'large'}}`。
 */

/** 该 formatter 认的记录形状：`icon`（三协议字符串）+ `name` */
interface IconNameRecord {
  icon?: string
  name?: string
}

/** `iconName` 的参数：图标尺寸（同 `Avatar` 的 `size`）；不传 = `Avatar` 默认（32px） */
interface IconNameArgs {
  size?: AvatarProps['size']
}

/**
 * 「图标 + 名称」：**布局仍归 pro 的 `iconNameCell`**（一份实现，企业列表 / 插件 / 技能包共用），
 * 这里只补两件宿主才知道的事：
 *
 * 1. 图标怎么画（`renderIconFont` —— 三条协议里 `icon://` 那条要用它）；
 * 2. 图标多大（`args.size`，声明里传进来的；pro 只透传，不认识它）。
 *
 * `args` 是 `unknown`（`ValueFormatter` 的口径：pro 不校验参数形状）⇒ 宿主这边收窄一次。
 */
export const iconNameFormatter: ValueFormatter = (value, ctx, args) => {
  const {size} = (args ?? {}) as IconNameArgs
  const record = ctx.record as IconNameRecord
  return iconNameCell<IconNameRecord>({
    renderIcon: renderIconFont,
    nameOf: (item) => item.name ?? '',
    iconOf: (item) => item.icon,
    size,
  })(value, record) as unknown as VNode
}

export const crudFormatters = {iconName: iconNameFormatter}
