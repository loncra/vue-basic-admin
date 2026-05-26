import {AttachmentService, FindRestfulCrudService} from "@/apis";
import type {ExportDataMetadata} from "@/types/apis";


/**
 * 附件领域服务：`/api[/resource-server]/attachment/user/export`
 *
 * @author maurice.chen
 */
export class UserExportService extends FindRestfulCrudService<ExportDataMetadata, ExportDataMetadata>{
  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = AttachmentService.BASE_URL + '/user/export'

  constructor() {
    super(UserExportService.SERVICE_URL)
  }
}
