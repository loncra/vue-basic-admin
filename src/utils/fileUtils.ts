import type {VideoThumbnailResult} from '@/types/composables/common'
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {ObjectItemInfo, ObjectWriteResult} from "@/types/apis";
import type {
  AttachmentFileItem,
  AttachmentPathItem,
  AttachmentValue
} from "@/types/composables/attachmentUpload.ts";
import {AttachmentService} from "@/apis";
import {
  FILE_OR_FOLDER_NAME_MAX_LENGTH,
  RESERVED_FILE_OR_FOLDER_NAME,
  VALID_REGX
} from "@/constants";

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
export function getImageBase64(file: File | undefined): Promise<string> {

  return new Promise((resolve, reject) => {
    if (!file) {
      reject('file is undefined')
      return ;
    }
    const reader = new FileReader()
    // 读取文件为 Data URL 格式（Base64）
    reader.readAsDataURL(file)
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

export function isObjectItemInfo(item: unknown): item is ObjectWriteResult {
  return !!item
    && typeof item === 'object'
    && 'bucketName' in item
    && 'objectName' in item
}

export function convertUploadFiles(
  fileList: AttachmentFileItem[],
): UploadFile<ObjectWriteResult>[] {
  const result: UploadFile<ObjectWriteResult>[] = []
  for (const file of fileList) {
    if (isObjectWriteResult(file)) {
      const contentType = file?.extraHeaders?.['Content-Type'] || ''
      const url = AttachmentService.query(file.bucketName, file.objectName)
      result.push({
        uid: file.etag,
        name: file?.extraHeaders?.['x-amz-meta-original-filename'] || file.objectName,
        url,
        thumbUrl: ['image/', 'video/'].some(v => contentType.startsWith(v)) ? url : undefined,
        type: contentType || undefined,
        size: file.size || 0,
        percent: 100,
        status: 'done',
        response: file,
      })
    } else if (isUploadFile(file)) {
      result.push(file)
    } else if (isObjectItemInfo(file)) {
      const item = file as ObjectItemInfo
      const contentType = file?.userMetadata?.['Content-Type'] || ''
      if (item.dir) {

      }
      const url = ''//AttachmentService.query(file.bucketName, item.objectName)
      result.push({
        uid: item.etag,
        name: item?.userMetadata?.['X-Amz-Meta-Original-Filename'] || item.objectName,
        url,
        thumbUrl: ['image/', 'video/'].some(v => contentType.startsWith(v)) ? url : undefined,
        type: contentType || undefined,
        size: file.size || 0,
        percent: 100,
        status: 'done',
        response: file,
      })
    }
  }

  return result
}

/**
 * @deprecated
 * @param file
 */
export function displayUploadFileToListItem(
  file: UploadFile<ObjectWriteResult>,
): AttachmentFileItem {
  if (file.originFileObj) {
    return file
  }
  if (file.response) {
    return file.response
  }
  return file
}

export function detectAttachmentValueMode(
  value: AttachmentValue | null,
  maxCount?: number,
): 'single' | 'multiple' {
  if (Array.isArray(value)) {
    return 'multiple'
  }
  if (isUploadFile(value) || isObjectWriteResult(value)) {
    return 'single'
  }
  return maxCount === 1 ? 'single' : 'multiple'
}

export function normalizeAttachmentToList(
  value: AttachmentValue | null,
): (UploadFile | ObjectWriteResult | ObjectItemInfo)[] {
  if (value == null) {
    return []
  }
  if (Array.isArray(value)) {
    return [...value]
  }
  if (isObjectWriteResult(value)) {
    return [...convertUploadFiles([value as ObjectWriteResult])]
  }
  return []
}

export function denormalizeAttachmentFromList(
  list: (UploadFile | ObjectWriteResult)[],
  referenceValue: AttachmentValue | null,
  maxCount?: number,
): AttachmentValue {
  const mode = detectAttachmentValueMode(referenceValue, maxCount)
  if (list.length === 0) {
    return mode === 'single' ? undefined : []
  }
  return mode === 'single' ? list[0] : [...list]
}

function relativePathOf(file: UploadFile): string | undefined {
  const raw = file.originFileObj as File | undefined
  const path = raw?.webkitRelativePath?.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  return path || undefined
}

export function buildAttachmentPathTree(
  files: UploadFile<ObjectWriteResult>[],
): AttachmentPathItem[] {
  const roots: AttachmentPathItem[] = []
  const folders = new Map<string, AttachmentPathItem>()
  function folderNode(absPath: string, name: string): AttachmentPathItem {
    let node = folders.get(absPath)
    if (node) {
      return node
    }
    node = {
      uid: `dir:${absPath}`,
      name,
      type:'directory',
      children: [],
    }
    folders.set(absPath, node)
    return node
  }
  function parentList(dirAbsPath: string): AttachmentPathItem[] {
    if (!dirAbsPath) {
      return roots
    }
    let siblings = roots
    let acc = ''
    for (const seg of dirAbsPath.split('/')) {
      acc = acc ? `${acc}/${seg}` : seg
      const node = folderNode(acc, seg)
      if (!siblings.includes(node)) {
        siblings.push(node)
      }
      siblings = node.children!
    }
    return siblings
  }
  for (const file of files) {
    const path = relativePathOf(file)
    if (!path) {
      roots.push({ ...file })
      continue
    }
    const parts = path.split('/').filter(Boolean)
    const fileName = parts.pop()!
    const dirAbs = parts.join('/')
    parentList(dirAbs).push({
      ...file,
      name: fileName,
    })
  }
  applyAttachmentDirectoryProgress(roots)
  return roots
}

/** 树上的文件节点（保留原引用；目录节点不包含在内） */
export function collectAttachmentFileLeaves(
  nodes: AttachmentPathItem[] = [],
): AttachmentPathItem[] {
  const result: AttachmentPathItem[] = []
  for (const node of nodes) {
    if (node.type === 'directory') {
      result.push(...collectAttachmentFileLeaves(node.children ?? []))
    } else {
      result.push(node)
    }
  }
  return result
}

/** 按子孙文件 size 加权，把目录的 size / percent / status 对齐到叶子 */
export function applyAttachmentDirectoryProgress(nodes: AttachmentPathItem[] = []): void {
  for (const node of nodes) {
    if (node.type !== 'directory') {
      continue
    }
    applyAttachmentDirectoryProgress(node.children ?? [])
    const leaves = collectAttachmentFileLeaves([node])
    const total = leaves.reduce((sum, file) => sum + (file.size || 0), 0)
    const loaded = leaves.reduce(
      (sum, file) => sum + ((file.size || 0) * (file.percent || 0)) / 100,
      0,
    )
    const percent = total > 0 ? Math.floor((loaded * 100) / total) : 0
    if (node.size !== total) {
      node.size = total
    }
    if (node.percent !== percent) {
      node.percent = percent
    }
    let status: AttachmentPathItem['status']
    if (leaves.some((file) => file.status === 'error')) {
      status = 'error'
    } else if (leaves.length > 0 && leaves.every((file) => file.status === 'done')) {
      status = 'done'
    } else if (leaves.some((file) => file.status === 'uploading')) {
      status = 'uploading'
    } else {
      status = undefined
    }
    if (node.status !== status) {
      node.status = status
    }
  }
}

/** @returns 错误 i18n key；通过则 undefined */
export function validateFileOrFolderName(name: string | undefined): string | undefined {
  const value = name?.trim() ?? ''
  if (!value) {
    return 'error.valid.fileOrFolderName.empty'
  }
  if (RESERVED_FILE_OR_FOLDER_NAME.has(value)) {
    return 'error.valid.fileOrFolderName.reserved'
  }
  if (value.length > FILE_OR_FOLDER_NAME_MAX_LENGTH) {
    return 'error.valid.fileOrFolderName.tooLong'
  }
  if (VALID_REGX.ILLEGAL_FILE_OR_FOLDER_NAME.test(value)) {
    return 'error.valid.fileOrFolderName.illegal'
  }
  return undefined
}
