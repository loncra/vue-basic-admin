import type {RestResult, UserPluginInstallRequestBody, UserPluginInstallResult} from '@/types/apis'
import axios from '@/requests/http.ts'
import {getEnumValue} from '@/utils'

/**
 * 用户广场插件安装：`/api[/ai-server]/ai/user/plugin/install`
 *
 * @author maurice.chen
 */
export class AiUserPluginInstallService {
  static readonly BASE_URL: string =
    '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/ai-server' : '')

  static readonly SERVICE_URL = AiUserPluginInstallService.BASE_URL + '/ai/user/plugin/install'

  /** `POST /ai/user/plugin/install` */
  static install(
    body: UserPluginInstallRequestBody,
  ): Promise<RestResult<UserPluginInstallResult>> {
    return axios.post(AiUserPluginInstallService.SERVICE_URL, body)
  }

  /** `POST /ai/user/plugin/install/my` */
  static my(): Promise<RestResult<UserPluginInstallResult[]>> {
    return axios.post(AiUserPluginInstallService.SERVICE_URL + '/my')
  }

  /** `DELETE /ai/user/plugin/install/{id}` */
  static uninstall(id: number): Promise<RestResult<void>> {
    return axios.delete(AiUserPluginInstallService.SERVICE_URL + '/' + id)
  }

  static mapInstallsByPackageId(
    installs: UserPluginInstallResult[],
    targetType: number,
  ): Map<number, UserPluginInstallResult> {
    const map = new Map<number, UserPluginInstallResult>()
    for (const install of installs) {
      if (install.packageId == null || getEnumValue(install.targetType) !== targetType) {
        continue
      }
      map.set(install.packageId, install)
    }
    return map
  }
}
