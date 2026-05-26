import {AttachmentService, FindRestfulCrudService} from "@/apis";
import type {ObjectItemInfo} from "@/types/apis";

/**
 * 我的资源领域服务：`/api[/resource-server]/attachment/my`
 *
 * @author maurice.chen
 */
export class MyResourceService extends FindRestfulCrudService<ObjectItemInfo, ObjectItemInfo> {
  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = AttachmentService.BASE_URL + '/my'

  constructor() {
    super(AttachmentService.BASE_URL)
  }
}
