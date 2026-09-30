import {h} from 'vue'
import {Badge, type BadgeProps, Space, Tooltip, type AvatarProps, TypographyText} from 'antdv-next'
import {
  AuthServerService as AuthServerClient,
  type PlatformUser,
  type UserMetadata,
} from '@loncra/client/auth'
import {AUDIT_STATUS_VALUE, getEnumName, getEnumValue} from '@loncra/client/commons'
import type {VNode} from '@loncra/antdv'
import {
  type FormatContext,
  iconNameCell,
  UserAvatar,
  type ValueFormatter,
} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {usePrincipalStore} from '@/stores/principalStore'
import {renderIconFont} from '@/utils/commonUtils'

/**
 * 宿主注册给 CRUD DSL 的 **formatter 表**（`<l-provider :formatters="…">`
 * → `CrudConfigProvider` → 按 key 覆盖 pro 的内置表）。
 *
 * 声明里写 `format: 'iconName'`，或带参数 `format: {name: 'iconName', args: {size: 'large'}}`。
 */

// #region 图标 + 名称

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

// #endregion

// #region 头像 + 显示名

/** `principalName` 的参数 */
interface PrincipalNameArgs {
  /** 是当前登录者本人时，名字后面加一个「(我)」；默认不加 */
  self?: boolean
}

/**
 * 用户的显示名：**底层仍是 client 的实现**（`realName || nickname || username`，见
 * `packages/client/src/commons/api/authServerService.ts`），这里只补宿主的兜底文案（i18n 的「未命名」）
 * —— 与宿主旧 `apis/auth-server/authServerService.ts` 那层覆写是同一个口径，所以 CRUD 侧
 * 不再依赖那个文件（IM 还在用它，等 IM 迁移时一起收）。
 */
export function getPrincipalName(user: unknown): string {
  // `unknown` → client 的入参：调用点要么是实体本身、要么是 `record.member`，都是用户对象
  return AuthServerClient.getPrincipalNameByUserDetails(
    user as PlatformUser | UserMetadata | undefined | null,
    i18n.global.t('common.unname'),
  )
}

/** 当前登录者本人？（只有 `args.self` 时才去取 store） */
function isSelf(user: unknown): boolean {
  const id = (user as {id?: unknown}).id
  return id != null && id === usePrincipalStore().state.principal.id
}

/**
 * 取"人"：**值本身是对象就用值**（邀请表列的是 `member`，本来就是一个"人"），
 * 否则用整条记录（成员 / 用户表的列是 `realName` / `nickname`，值是名字字符串）。
 * 在 `unknown` 的边界上收窄一次 —— 两个调用点传进来的都是用户对象。
 */
function pickUser(value: unknown, record: unknown): PlatformUser | undefined {
  const candidate =
    value && typeof value === 'object' ? value : ((record as {member?: unknown})?.member ?? record)
  return candidate && typeof candidate === 'object' ? (candidate as PlatformUser) : undefined
}

/**
 * 「头像 + 显示名」（可选「(我)」）：CRUD 里所有"用户"列统一用它。
 *
 * **一个入口就够**（注册名 `'principalName'`，声明统一写
 * `format: {name: 'principalName', args: {self: true}}`，不需要 `render` 旁路）：pro 的 `formatValue`
 * 把**空值也交给 formatter**（`crud-page/registry.ts`：只有没声明 `format` 时才走空串兜底）
 * ⇒ 列的值是可选字段（`realName` / `nickname`）时 formatter 照样执行、从整条记录里取"人"。
 */
export const principalNameFormatter: ValueFormatter = (value, ctx, args) => {
  const {self} = (args ?? {}) as PrincipalNameArgs
  const user = pickUser(value, ctx.record)
  return h(Space, null, {
    default: () => [
      h(UserAvatar, {user, size: 'large'}),
      getPrincipalName(user),
      ...(self && isSelf(user)
        ? [h(TypographyText, {type: 'success'}, {default: () => `(${i18n.global.t('common.me')})`})]
        : []),
    ],
  }) as unknown as VNode
}

// #endregion

// #region 审核状态

/**
 * 审核状态 → 状态点（`a-badge` 的 `status`）：**后端一个枚举、蚂蚁五个状态点**，多对一
 * （值取 commons 的 `AUDIT_STATUS_VALUE`）—— `AUDITABLE`(10) → processing、`AGREED`(20) → success、
 * `DISAGREE`(30) → error、`REJECTED`(40) → warning。改外观只动这一张表。
 */
const AUDIT_STATUS_BADGE: Record<number, BadgeProps['status']> = {
  [AUDIT_STATUS_VALUE.AUDITABLE]: 'processing',
  [AUDIT_STATUS_VALUE.AGREED]: 'success',
  [AUDIT_STATUS_VALUE.DISAGREE]: 'error',
  [AUDIT_STATUS_VALUE.REJECTED]: 'warning',
}

/**
 * 审核状态：**状态点 + 状态名**（`a-badge`），表里没有的值（`UNKNOWN` 等）落 `default`。
 * 备注非空时整块套 `Tooltip`，内容就是 `record.remark`（审核意见）。
 *
 * 套路与 pro 的 `executeStatusCell` 相同 —— 但那张表在 pro、这张是**业务映射**，所以留宿主。
 * 空值返回空串：`formatValue` 现在**空值也调用 formatter** ⇒ `getEnumName(null)` 会出字符串
 * `"null"`，必须自己挡（同 pro 内置表那几个）。
 */
export const auditStatusFormatter: ValueFormatter = (value, ctx) => {
  if (value == null) {
    return ''
  }
  const status = AUDIT_STATUS_BADGE[Number(getEnumValue(value))] ?? 'default'
  const badge = h(Badge, {status, text: getEnumName(value)})
  const remark = (ctx.record as {remark?: string} | undefined)?.remark
  return (remark ? h(Tooltip, {title: remark}, {default: () => badge}) : badge) as unknown as VNode
}

// #endregion

export const crudFormatters = {
  iconName: iconNameFormatter,
  principalName: principalNameFormatter,
  auditStatus: auditStatusFormatter,
}
