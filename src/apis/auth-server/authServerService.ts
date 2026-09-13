import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import {AuthServerService as AuthServerClient} from '@loncra/client/auth'
import i18n from '@/i18n'

/**
 * 展示名默认走 i18n，留在管理端。
 */
export class AuthServerService extends AuthServerClient {
  static getPrincipalNameByUserDetails(
    details: PlatformUser | UserMetadata,
    defaultValue: string = i18n.global.t('common.unname'),
  ): string {
    return AuthServerClient.getPrincipalNameByUserDetails(details, defaultValue)
  }
}
