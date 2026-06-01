import type {FileObject, RestResult} from "@/types/apis";
import axios from "@/requests/http.ts";

/**
 * message-server 侧通用查询。
 *
 * @author maurice.chen
 */
export class MessageServerService {

  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/message-server' : '')

  static readonly UNREAD_QUANTITY_URL = MessageServerService.BASE_URL + '/unreadQuantity'

  static readonly MESSAGE_TYPE_URL = MessageServerService.BASE_URL + '/unreadQuantity'

  static unreadQuantity(): Promise<RestResult<void>> {
    return axios.get(MessageServerService.UNREAD_QUANTITY_URL)
  }

  static messageTypes(): Promise<RestResult<void>> {
    return axios.get(MessageServerService.MESSAGE_TYPE_URL)
  }
}
