import type {
  CompleteMultipartUploadBody,
  FileObject,
  MultipartUploadInitData,
  MultipartUploadPartData,
  ObjectItemInfo,
  ObjectWriteResult,
  RestResult
} from "@/types/apis";
import axios from '@/requests/http.ts'
import type {AxiosRequestConfig} from 'axios'

/**
 * 附件领域服务：`/api[/resource-server]/user/export`
 *
 * @author maurice.chen
 */
export class AttachmentService {
  static readonly BASE_URL: string = '/api' + (import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? '/resource-server/attachment' : '/attachment')

  static readonly MULTI_OBJECT_URL = AttachmentService.BASE_URL + '/multiObject'

  static readonly SINGLE_UPLOAD_URL = AttachmentService.BASE_URL + '/upload'

  static readonly CREATE_MULTIPART_URL = AttachmentService.BASE_URL + '/createMultipartUpload'

  static readonly UPLOAD_MULTIPART = AttachmentService.BASE_URL + "/uploadPart"

  static readonly COMPLETE_MULTIPART_UPLOAD_URL = AttachmentService.BASE_URL + '/completeMultipartUpload'

  static readonly DELETE_ATTACHMENT_URL = AttachmentService.BASE_URL + '/delete'

  static readonly BUCKETS_URL = AttachmentService.BASE_URL + '/buckets'

  static readonly FIND_ATTACHMENT_URL = AttachmentService.BASE_URL + '/find'

  static readonly MY_RESOURCE_URL = AttachmentService.BASE_URL + '/my/find'

  static query(
    bucket:string,
    object:string,
    download = false
  ):string {
    const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    return AttachmentService.BASE_URL
      + '/'
      + bucket
      + '?objectName='
      + object
      + '&download='
      + download
      + '&accessToken='
      + localStorage.getItem(accessTokenStorageName)
  }

  static download(bucket:string, object:string) {
    const url:string = this.query(bucket, object, true)
    window.open(url);
  }

  static downloads(fileObjects:FileObject[]) {
    const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    const url:string = AttachmentService.MULTI_OBJECT_URL
      + "?json="
      + encodeURIComponent(JSON.stringify(fileObjects))
      + '&accessToken='
      + localStorage.getItem(accessTokenStorageName)
    window.open(url);
  }

  static singleUpload(type: string, formData: FormData, config: AxiosRequestConfig = {}): Promise<RestResult<ObjectWriteResult>> {
    return axios.post(AttachmentService.SINGLE_UPLOAD_URL + '/' + type, formData, config)
  }

  static createMultipartUpload(type: string, param: URLSearchParams): Promise<RestResult<MultipartUploadInitData>> {
    return axios.get(AttachmentService.CREATE_MULTIPART_URL + '/' + type, {params: param})
  }

  static uploadMultipart(
    partNumber: number,
    uploadId: string,
    formData: FormData,
    config: AxiosRequestConfig = {},
  ): Promise<RestResult<MultipartUploadPartData>> {
    const url = AttachmentService.UPLOAD_MULTIPART + '/' + partNumber + '/' + uploadId
    return axios.postForm(url, formData, config)
  }

  static completeMultipartUpload(
    data: CompleteMultipartUploadBody,
    config: AxiosRequestConfig = {},
  ): Promise<RestResult<ObjectWriteResult>> {
    return axios.post(AttachmentService.COMPLETE_MULTIPART_UPLOAD_URL, data, config)
  }

  static removeAttachment(fileObjects: FileObject[]): Promise<RestResult<void>> {
    return axios.put(AttachmentService.DELETE_ATTACHMENT_URL, fileObjects)
  }

  static resourceByFileObject(file:FileObject):string {
    return AttachmentService.resource(file.bucketName, file.objectName)
  }

  static resource(bucketName:string, objectName:string):string {
    return import.meta.env.VITE_APP_RESOURCE_PATH + "/" + bucketName + "/" + objectName
  }

  static buckets():Promise<RestResult<Record<string, unknown>[]>> {
    return axios.get(AttachmentService.BUCKETS_URL)
  }

  static findAttachment(type:string, filename:string):Promise<RestResult<ObjectItemInfo[]>> {
    let url = AttachmentService.FIND_ATTACHMENT_URL + "?type=" + type
    if (filename) {
      url += '&filename=' + filename
    }
    return axios.post(url)
  }

  static myResource(type:string, filename:string):Promise<RestResult<ObjectWriteResult[]>> {
    let url = AttachmentService.MY_RESOURCE_URL + "?type=" + type
    if (filename) {
      url += '&filename=' + filename
    }
    url += '&formatObjectWriteResult=' + true
    return axios.post(url)
  }

  static getAvatarUrlIfNotNull(item: FileObject | undefined) {
    if (!item) {
      return undefined
    }
    return item ? AttachmentService.query(item.bucketName, item.objectName) : ''
  }
}
