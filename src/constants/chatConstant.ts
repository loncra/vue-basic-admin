import type {RoleType} from '@antdv-next/x/dist/bubble/interface'

/**
 * 气泡列表的**默认 role 配置**（宿主侧）。
 *
 * ⚠️ **必须留宿主**（2026-10-01 用户指出）：里面的 `classes` 是**宿主的 Tailwind 类**
 *（`bg-primary-bg!` / `text-text-secondary!` / `my-xs!` 等）—— `packages/**` **不带 Tailwind**，
 * 放进包里等于让包依赖宿主的样式系统（包一旦被别的宿主用就会失效）。
 * 谁要气泡外观要么用这份常量，要么走自己的 Tailwind 配置；包只负责渲染，不提供默认外观。
 *
 * 三个消费者都在宿主：`components/basic/chat/BubbleList.vue`（无 `:role` 时的兜底）、
 * `composables/message-server/chat/useChatBubbleList.ts`（IM 的 role）、
 * `composables/ai-server/agent/userAgentView.ts`（`createAgentBubbleListRole()` 的 base）。
 */
export const DEFAULT_BUBBLE_LIST_ROLE = {
  user: {
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: 'bg-primary-bg!'},
  },
  ai: {
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
  },
  system: {
    variant: 'outlined',
    shape: 'round',
    classes: {content: 'text-text-secondary!'},
  },
  divider: {
    dividerProps: {
      plain: true,
      dashed: true,
      size: 'small',
      classes: {
        content: 'text-text-secondary! text-xs! font-normal!',
        root: 'text-text-secondary! text-xs! font-normal! my-xs!',
      },
    },
  },
} as RoleType
