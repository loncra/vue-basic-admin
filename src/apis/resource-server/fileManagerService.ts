import {AttachmentService, FindRestfulCrudService} from "@/apis";
import type {ObjectItemInfo} from "@/types/apis";

/**
 * 附件领域服务：`/api[/resource-server]/attachment`
 *
 * @author maurice.chen
 */
export class FileManagerService extends FindRestfulCrudService<ObjectItemInfo, ObjectItemInfo> {

  constructor() {
    super(AttachmentService.BASE_URL)
  }
}
