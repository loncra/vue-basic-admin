import type {VideoThumbnailResult} from '@/types/composables/common'
import type {UploadFile, VcFile} from "antdv-next/dist/upload/interface";
import type {ObjectWriteResult} from "@/types/apis";
import {AttachmentService} from "@/apis";

/**
 * 格式化字节大小为可读的字符串
 * 将字节数转换为合适的单位（bytes、KB、MB、GB 等）
 * 使用 1024 为进制进行计算
 *
 * @param bytes - 要格式化的字节数
 * @returns 格式化后的字符串，例如 "1.5 MB"
 *
 * @example
 * ```typescript
 * byteFormat(1024) // "1 KB"
 * byteFormat(1536) // "1.5 KB"
 * byteFormat(1048576) // "1 MB"
 * ```
 */
export function byteFormat(bytes: number): string {
  // 检查输入是否为有效数字
  if (isNaN(bytes)) {
    return ''
  }
  // 单位数组
  const symbols = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  // 计算对数值以确定使用哪个单位（以 2 为底）
  let exp = Math.floor(Math.log(bytes) / Math.log(2))
  if (exp < 1) {
    exp = 0
  }
  // 确定单位索引（每 10 位对应对数表示一个单位）
  const i = Math.floor(exp / 10)
  // 转换为对应单位的数值
  let formattedBytes = bytes / Math.pow(2, 10 * i)

  // 如果小数部分过长，保留两位小数
  if (formattedBytes.toString().length > formattedBytes.toFixed(2).toString().length) {
    formattedBytes = Number(formattedBytes.toFixed(2))
  }
  return formattedBytes + ' ' + symbols[i]
}

/**
 * 将图片文件转换为 Base64 编码字符串
 * 使用 FileReader API 读取文件内容并转换为 Data URL 格式
 *
 * @param file - 要读取的图片文件对象
 * @returns Promise 对象，成功时返回 Base64 编码的字符串（Data URL 格式）
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * getImageBase64(file)
 *   .then(base64 => console.log('图片 Base64:', base64))
 *   .catch(err => console.error('读取失败', err));
 * ```
 */
export function getImageBase64(file: VcFile | undefined): Promise<string> {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('file is undefined')
      return ;
    }
    const reader = new FileReader()
    // 读取文件为 Data URL 格式（Base64）
    reader.readAsDataURL(file as VcFile)
    // 读取成功
    reader.onload = () => resolve(reader.result as string)
    // 读取失败
    reader.onerror = (error) => reject(error)
  })
}

/**
 * 获取视频文件的缩略图
 * 通过创建视频元素并捕获第一帧来生成缩略图
 * 返回缩略图的 Base64 数据和视频的 Object URL
 *
 * @param file - 要处理的视频文件对象
 * @returns Promise 对象，成功时返回包含 base64 和 videoUrl 的对象
 *
 * @example
 * ```typescript
 * const file = event.target.files[0];
 * getVideoThumbnail(file)
 *   .then(result => {
 *     console.log('缩略图 Base64:', result.base64);
 *     console.log('视频 URL:', result.videoUrl);
 *   })
 *   .catch(err => console.error('生成缩略图失败', err));
 * ```
 */
export function getVideoThumbnail(file: File): Promise<VideoThumbnailResult> {
  return new Promise((resolve, reject) => {
    // 创建视频文件的 Object URL
    const url = URL.createObjectURL(file)
    // 创建视频和画布元素
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // 检查是否能获取 Canvas 上下文
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // 配置视频元素
    video.src = url
    video.muted = true // 静音避免某些浏览器的自动播放限制
    video.playsInline = true // 允许内联播放

    // 当视频元数据加载完成时
    video.addEventListener('loadedmetadata', () => {
      // 设置视频时间到第一帧（0.1 秒避免 0 秒可能出现的黑屏）
      video.currentTime = 0.1
    })

    // 当视频跳转到指定时间后
    video.addEventListener('seeked', () => {
      // 设置 Canvas 尺寸（固定为 150x150 像素）
      canvas.width = 150
      canvas.height = 150

      // 将视频帧绘制到 Canvas 上
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // 将 Canvas 内容转换为 JPEG 格式的 Base64 字符串（质量 0.8）
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      resolve({
        base64: dataUrl,
        videoUrl: url,
      })
    })

    // 处理视频加载错误
    video.addEventListener('error', reject)
  })
}

export function isObjectWriteResult(item: unknown): item is ObjectWriteResult {
  return !!item
    && typeof item === 'object'
    && 'bucketName' in item
    && 'objectName' in item
}

export function isUploadFile(item: unknown): item is UploadFile {
  return !!item && typeof item === 'object' && 'uid' in item
}

export function convertUploadFiles(fileList:ObjectWriteResult[] | UploadFile[], service:AttachmentService):UploadFile[] {
  const result: UploadFile[] = []
  for (const file of fileList) {
    if (isObjectWriteResult(file)) {
      const contentType = file?.extraHeaders?.['Content-Type'] || ''
      const url = service.query(file.bucketName, file.objectName)
      result.push({
        uid: file.etag,
        name: file?.extraHeaders?.['x-amz-meta-original-filename'] || file.objectName,
        url,
        thumbUrl: contentType.includes('image/') ? url : undefined,
        type: contentType || undefined,
        size: Number(file?.extraHeaders?.['Size'] || 0),
        status: 'done',
      })
    } else if (isUploadFile(file)) {
      result.push(file)
    }
  }

  return result
}
