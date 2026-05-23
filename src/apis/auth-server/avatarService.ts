import type {AuthenticationInfo, ObjectWriteResult, RestResult} from "@/types/apis";
import axios from "@/requests/http.ts";


export class AvatarServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')
  /** 上传头像 */
  static readonly PRINCIPAL_AVATAR_UPLOAD_URL = AvatarServerService.BASE_URL + '/user/avatar'

  static update(object:ObjectWriteResult | null): Promise<RestResult<void>> {
    return axios.put(AvatarServerService.PRINCIPAL_AVATAR_UPLOAD_URL, object,{headers:{"Content-Type":"application/json"}})
  }

  static getUploadUrl(authInfo:AuthenticationInfo) {
    return AvatarServerService.PRINCIPAL_AVATAR_UPLOAD_URL + "?accessToken=" + (authInfo?.details?.token?.value || '');
  }
}
