/** Agent 点名：TRIGGER 开弹层；MCP/SKILL 写入 instruction 槽 prefix */
export const AGENT_INSTRUCTION_PREFIX = {
  TRIGGER: '/',
  MCP: '/mcp',
  SKILL: '/skill',
} as const

export const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'])
export const VIDEO_EXT = new Set(['mp4', 'webm', 'ogg', 'mov', 'm4v'])
export const AUDIO_EXT = new Set(['mp3', 'wav', 'flac', 'm4a', 'aac'])

export const TEXT_MAX_BYTES = 5 * 1024 * 1024
