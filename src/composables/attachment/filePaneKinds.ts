import type {ObjectItemInfo} from '@/types/apis'

export type FilePaneKindId = 'image' | 'video' | 'audio' | 'text' | 'fallback'
export type FilePaneMode = 'view' | 'edit'

export interface FilePaneContext {
  name: string
  mime: string
  ext: string
  size: number
}

export interface ResolvedFilePaneKind {
  id: FilePaneKindId
  mode: FilePaneMode
}

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'])
const VIDEO_EXT = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v'])
const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac'])
const TEXT_EXT = new Set([
  'md', 'markdown', 'json', 'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx',
  'vue', 'py', 'yml', 'yaml', 'sh', 'bash', 'html', 'htm', 'css',
  'xml', 'txt', 'toml', 'ini', 'env', 'gitignore', 'sql', 'java',
])

export const TEXT_MAX_BYTES = 2 * 1024 * 1024

function extOf(name: string): string {
  const base = name.replace(/\/$/, '').split('/').pop() ?? name
  const i = base.lastIndexOf('.')
  return i <= 0 ? '' : base.slice(i + 1).toLowerCase()
}

export function buildFilePaneContext(item: ObjectItemInfo): FilePaneContext {
  const name =
    item.userMetadata?.['X-Amz-Meta-Original-Filename']
    || item.objectName.replace(/\/$/, '').split('/').pop()
    || item.objectName
  const mime = (item.userMetadata?.['Content-Type'] || '').toLowerCase()
  return {name, mime, ext: extOf(name), size: item.size || 0}
}

export function resolveFilePaneKind(ctx: FilePaneContext): ResolvedFilePaneKind {
  if (ctx.mime.startsWith('image/') || IMAGE_EXT.has(ctx.ext)) {
    return {id: 'image', mode: 'view'}
  }
  if (ctx.mime.startsWith('video/') || VIDEO_EXT.has(ctx.ext)) {
    return {id: 'video', mode: 'view'}
  }
  if (ctx.mime.startsWith('audio/') || AUDIO_EXT.has(ctx.ext)) {
    return {id: 'audio', mode: 'view'}
  }
  if (
    ctx.mime.startsWith('text/')
    || ctx.mime === 'application/json'
    || ctx.mime === 'application/xml'
    || TEXT_EXT.has(ctx.ext)
  ) {
    return {id: 'text', mode: 'edit'}
  }
  return {id: 'fallback', mode: 'view'}
}

export function isTextTooLarge(size: number): boolean {
  return size > TEXT_MAX_BYTES
}
