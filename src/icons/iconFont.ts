import {h, type VNode} from 'vue'
import {createFromIconfontCN} from '@antdv-next/icons'

export const IconFont = createFromIconfontCN({
  scriptUrl: [
    '/font_loncra_icon/iconfont.js',
    '/font_ai_icon/iconfont.js',
    '/font_xiaojiage/iconfont.js',
  ],
})

const ICON_ALIGN_OVERRIDES: Record<string, string> = {}

export function iconFontRender(type?: string, attrs?: Record<string, unknown>): VNode | null {
  if (!type) {
    return null
  }
  return h(IconFont, {
    type,
    class: ['icon', attrs?.class, ICON_ALIGN_OVERRIDES[type]],
    spin: attrs?.spin as boolean | undefined,
    rotate: attrs?.rotate as number | undefined,
  })
}
