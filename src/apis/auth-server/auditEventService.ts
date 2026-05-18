import {DetailSearchRestfulService} from "@/apis/detailSearchRestfulService.ts";
import type {AuditEventEntity} from "../../types/apis/auth-server/auditDomain.ts";
import type {RestResult} from "@/types/apis";
import axios from "@/requests/http.ts";


export class AuditEventService extends DetailSearchRestfulService<AuditEventEntity> {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/auth-server' : '')

  static readonly SERVICE_URL = AuditEventService.BASE_URL + '/audit/event/authentication'
  constructor() {
    super(AuditEventService.SERVICE_URL)
  }

  detail(id: string, after:string): Promise<RestResult<AuditEventEntity>> {
    return axios.get(this.baseUrl + "/" + id + "?after=" + after)
  }
}
