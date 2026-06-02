import type {FileObject, IdNameMetadata, RestResult} from "@/types/apis";
import axios from "@/requests/http.ts";

/**
 * message-server 侧通用查询。
 *
 * @author maurice.chen
 */
export class MessageServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  static readonly UNREAD_QUANTITY_URL = MessageServerService.BASE_URL + '/unreadQuantity'

  static readonly TYPE_URL = MessageServerService.BASE_URL + '/types'

  static unreadQuantity(): Promise<RestResult<Record<number, number>>> {
    return axios.get(MessageServerService.UNREAD_QUANTITY_URL)
  }

  static types(category:string): Promise<RestResult<IdNameMetadata[]>> {
    return axios.get(MessageServerService.TYPE_URL + '/' +category)
  }
}
