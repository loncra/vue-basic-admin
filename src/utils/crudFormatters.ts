import {h} from 'vue'
import {type AvatarProps, Badge, type BadgeProps, Space, Tooltip, TypographyText} from 'antdv-next'
import {
  AuthServerService as AuthServerClient,
  type PlatformUser,
  type UserMetadata,
} from '@loncra/client/auth'
import {AUDIT_STATUS_VALUE, getEnumName, getEnumValue} from '@loncra/client/commons'
import type {VNode} from '@loncra/antdv'
import {iconNameCell, UserAvatar, type ValueFormatter,} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {usePrincipalStore} from '@/stores/principalStore'
import {renderIconFont} from '@/utils/commonUtils'



interface IconNameRecord {
  icon?: string
  name?: string
}

interface IconNameArgs {
  size?: AvatarProps['size']
}

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



interface PrincipalNameArgs {
  self?: boolean
}

export function getPrincipalName(user: unknown): string {
  return AuthServerClient.getPrincipalNameByUserDetails(
    user as PlatformUser | UserMetadata | undefined | null,
  )
}

function isSelf(user: unknown): boolean {
  const id = (user as {id?: unknown}).id
  return id != null && id === usePrincipalStore().state.principal.id
}

function pickUser(value: unknown, record: unknown): PlatformUser | undefined {
  const candidate =
    value && typeof value === 'object' ? value : ((record as {member?: unknown})?.member ?? record)
  return candidate && typeof candidate === 'object' ? (candidate as PlatformUser) : undefined
}

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



const AUDIT_STATUS_BADGE: Record<number, BadgeProps['status']> = {
  [AUDIT_STATUS_VALUE.AUDITABLE]: 'processing',
  [AUDIT_STATUS_VALUE.AGREED]: 'success',
  [AUDIT_STATUS_VALUE.DISAGREE]: 'error',
  [AUDIT_STATUS_VALUE.REJECTED]: 'warning',
}

export const auditStatusFormatter: ValueFormatter = (value, ctx) => {
  if (value == null) {
    return ''
  }
  const status = AUDIT_STATUS_BADGE[Number(getEnumValue(value))] ?? 'default'
  const badge = h(Badge, {status, text: getEnumName(value)})
  const remark = (ctx.record as {remark?: string} | undefined)?.remark
  return (remark ? h(Tooltip, {title: remark}, {default: () => badge}) : badge) as unknown as VNode
}


export const crudFormatters = {
  iconName: iconNameFormatter,
  principalName: principalNameFormatter,
  auditStatus: auditStatusFormatter,
}
