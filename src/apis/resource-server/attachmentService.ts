import type {
  CompleteMultipartUploadBody,
  ExportDataMetadata,
  FileObject,
  MultipartUploadInitData,
  MultipartUploadPartData,
  ObjectWriteResult,
  RestResult
} from "@/types/apis";
import {FindRestfulCrudService} from "@/apis/findRestfulCrudService.ts";
import axios from '@/requests/http.ts'
import type {AxiosRequestConfig} from 'axios'

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

  static readonly SINGLE_UPLOAD_URL = AttachmentService.BASE_URL + '/upload'

  static readonly CREATE_MULTIPART_URL = AttachmentService.BASE_URL + '/createMultipartUpload'

  static readonly UPLOAD_MULTIPART = AttachmentService.BASE_URL + "/uploadPart"

  static readonly COMPLETE_MULTIPART_UPLOAD_URL = AttachmentService.BASE_URL + '/completeMultipartUpload'

  static readonly DELETE_ATTACHMENT_URL = AttachmentService.BASE_URL + '/delete'

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

  singleUpload(type: string, formData: FormData, config: AxiosRequestConfig = {}): Promise<RestResult<ObjectWriteResult>> {
    return axios.post(AttachmentService.SINGLE_UPLOAD_URL + '/' + type, formData, config)
  }

  createMultipartUpload(type: string, param: URLSearchParams): Promise<RestResult<MultipartUploadInitData>> {
    return axios.post(AttachmentService.CREATE_MULTIPART_URL + '/' + type, param)
  }

  uploadMultipart(
    partNumber: number,
    uploadId: string,
    formData: FormData,
    config: AxiosRequestConfig = {},
  ): Promise<RestResult<MultipartUploadPartData>> {
    const url = AttachmentService.UPLOAD_MULTIPART + '/' + partNumber + '/' + uploadId
    return axios.postForm(url, formData, config)
  }

  completeMultipartUpload(
    data: CompleteMultipartUploadBody,
    config: AxiosRequestConfig = {},
  ): Promise<RestResult<ObjectWriteResult>> {
    return axios.post(AttachmentService.COMPLETE_MULTIPART_UPLOAD_URL, data, config)
  }

  removeAttachment(fileObjects: FileObject[]): Promise<RestResult<void>> {
    return axios.put(AttachmentService.DELETE_ATTACHMENT_URL, fileObjects)
  }
}
