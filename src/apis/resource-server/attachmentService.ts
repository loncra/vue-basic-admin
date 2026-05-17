import type {ExportDataMetadata, FileObject} from "@/types";
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";

/**
 * 附件领域服务：`/api[/resource-server]/user/export`
 *
 * @author maurice.chen
 */
export class AttachmentService extends FindRestfulCrudService<ExportDataMetadata, ExportDataMetadata>{
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server/attachment' : '/attachment')

  /** 本服务相对 {@link BASE_URL} 的路径 */
  static readonly SERVICE_URL = AttachmentService.BASE_URL + '/user/export'

  static readonly MULTI_OBJECT_URL = AttachmentService.BASE_URL + '/multiObject'

  constructor() {
    super(AttachmentService.SERVICE_URL)
  }

  query(bucket:string, object:string,  download = false):string {
    const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    return AttachmentService.BASE_URL
      + '/'
      + bucket
      + '/'
      + object
      + '?download='
      + download
      + '&accessToken='
      + localStorage.getItem(accessTokenStorageName)
  }

  download(bucket:string, object:string) {
    const url:string = this.query(bucket, object, true)
    window.open(url);
  }

  downloads(fileObjects:FileObject[]) {
    const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    const url:string = AttachmentService.MULTI_OBJECT_URL
      + "?json="
      + encodeURIComponent(JSON.stringify(fileObjects))
      + '&accessToken='
      + localStorage.getItem(accessTokenStorageName)
    window.open(url);
  }
}
