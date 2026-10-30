import {fileURLToPath, URL} from 'node:url'

import {defineConfig, loadEnv, type Plugin} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

import tailwindcss from '@tailwindcss/vite'

import {AntdvNextResolver} from '@antdv-next/auto-import-resolver'
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import {AntdvNextXResolver} from "@antdv-next/auto-import-resolver-x";

/**
 * highlight.js 的 es/core.js 会 `import default from '../lib/core.js'`，
 * 而 lib/core.js 是 CJS（module.exports），Vite 直出时没有 named default，整页白屏。
 */
function highlightJsCoreEsmInterop(): Plugin {
  return {
    name: 'highlight-js-core-esm-interop',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0].replace(/\\/g, '/')
      if (!file.endsWith('/highlight.js/lib/core.js') || code.includes('export default')) {
        return null
      }
      return {
        code: `${code}\nexport default highlight;\n`,
        map: null,
      }
    },
  }
}

/**
 * x 包 `SlotTextAreaProseMirror` 用 Vue 全局 `render()` 把词槽芯片渲染进 ProseMirror DOM，
 * 脱离 app 上下文 ⇒ 芯片子树 inject 全部失效，cssinjs / icons 样式退回"未分层"插入
 * （非分层规则恒赢所有层）⇒ 芯片一挂载，全站字体/颜色样式错乱。
 * 这里在渲染前把主树的 appContext 挂到芯片 vnode 上，让 inject 恢复。
 * x 上游修复（render 前继承 appContext）落地后可删除本插件与 esbuild 补丁。
 */
function patchSlotRenderCode(code: string): string {
  if (code.includes('__slotAppContext')) return code
  return code
    .replace(
      'defineComponent, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from "vue"',
      'defineComponent, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, render, watch } from "vue"',
    )
    .replace(
      'setup(_, { expose }) {',
      'setup(_, { expose }) {\n\t\tconst __slotInstance = getCurrentInstance()\n\t\tconst __slotAppContext = __slotInstance ? Object.assign({}, __slotInstance.appContext, { provides: __slotInstance.provides }) : void 0\n\t\tconst __render = (vnode, dom) => { if (vnode && __slotAppContext && vnode.appContext !== __slotAppContext) vnode.appContext = __slotAppContext; render(vnode, dom) }',
    )
    .replace(/(?<![\w$.])render\((child, dom|null, dom|createVNode\(Skill_default)/g, '__render($1')
    .replace(
      'if (config.value) nodes.push(senderSchema.text(config.value));',
      'if (config.value) String(config.value).replace(/\\r/g, "").split("\\n").forEach((line, index, lines) => { if (line) nodes.push(senderSchema.text(line)); if (index < lines.length - 1) nodes.push(senderSchema.nodes.hardBreak.create()); });',
    )
    .replace(
      'if (config.value) result.push({\r\n\t\t\t\tkind: "text",\r\n\t\t\t\tvalue: config.value\r\n\t\t\t});',
      'if (config.value) String(config.value).replace(/\\r/g, "").split("\\n").forEach((line, index, lines) => { if (line) result.push({ kind: "text", value: line }); if (index < lines.length - 1) result.push({ kind: "text", value: "\\n" }); });',
    )
}

/**
 * rolldown 预构建在读取依赖时应用这里的 transform 补丁。
 * 注意：`optimizeDeps.esbuildOptions` 在 rolldown-vite 下是被忽略的废弃项，补丁挂在那里不会生效。
 * x 包 `SlotTextAreaProseMirror` 用全局 `render()` 渲染词槽芯片，脱离 app 上下文，
 * 导致芯片样式未分层插入、全站样式错乱 → 补挂 appContext + provides 链。
 * tiptap 的上传占位替换缺陷已在本地 fork（../antdv-next-tiptap，alias 直连）源码修复，无需补丁。
 * x 上游修复后可删除。
 */
const depPatchPlugins = [
  {
    name: 'patch-antdv-next-x-sender',
    transform(code: string, id: string) {
      const file = id.split('?')[0].replace(/\\/g, '/')
      if (!file.includes('@antdv-next/x/dist/sender/components/')) return null
      const patched = patchSlotRenderCode(code)
      return patched === code ? null : { code: patched, map: null }
    },
  },
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Tauri 开发时保留 Rust/CLI 日志，避免被 Vite 清屏
    clearScreen: false,
    envPrefix: ['VITE_', 'TAURI_'],
    plugins: [
      highlightJsCoreEsmInterop(),
      vue(), vueJsx(), tailwindcss(), Components({ resolvers: [AntdvNextResolver(), AntdvNextXResolver()] })
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      fs: {
        allow: [fileURLToPath(new URL('..', import.meta.url))],
      },
      proxy: {
        // 配置代理规则
        '/api': {
          target: env.VITE_APP_SERVER_URL, // 后端服务器地址
          changeOrigin: true, // 允许跨域
          rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，去掉 `/api` 前缀
        },
        '/socket.io': {
          target: env.VITE_APP_SERVER_SOCKET_URL, // 后端服务器地址
          changeOrigin: true, // 允许跨域
          ws: true, // WebSocket 代理
        },
      },
    },
    resolve: {
      alias: {
        // 与 tsconfig 对齐：从源码解析工作区包。走 node_modules 时 Vite 不监听，浏览器会一直用带 ?v= 的旧模块。
        '@loncra/antdv': fileURLToPath(new URL('../packages/antdv/src', import.meta.url)),
        '@loncra/client': fileURLToPath(new URL('../packages/client/src', import.meta.url)),
        '@loncra/antdv-pro': fileURLToPath(new URL('../packages/antdv-pro/src', import.meta.url)),
        '@loncra/antdv-chat': fileURLToPath(new URL('../packages/antdv-chat/src', import.meta.url)),
        '@loncra/antdv-chat-pro': fileURLToPath(new URL('../packages/antdv-chat-pro/src', import.meta.url)),
        '@loncra/chat-core': fileURLToPath(new URL('../packages/chat-core/src', import.meta.url)),
        // tiptap 编辑器用本地 fork（修复上传占位替换在空文档/节点视图失效场景下静默失败）。
        // css 条目必须排在裸名前面：对象别名按前缀替换，裸名会先把子路径吞掉。
        'antdv-next-tiptap/index.css': fileURLToPath(new URL('../antdv-next-tiptap/dist/index.css', import.meta.url)),
        'antdv-next-tiptap': fileURLToPath(new URL('../antdv-next-tiptap', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 源码别名后 peer 不再沿管理端 node_modules 往上找，显式指回本应用。
        'p-limit': fileURLToPath(new URL('./node_modules/p-limit', import.meta.url)),
        'dexie': fileURLToPath(new URL('./node_modules/dexie', import.meta.url)),
        // packages/antdv-chat-pro 的 stream 适配器（源码 alias 直连后同上：文件位置解析链上没有 x-sdk）。
        '@antdv-next/x-sdk': fileURLToPath(new URL('./node_modules/@antdv-next/x-sdk', import.meta.url)),
      },
      /**
       * `antdv-next-tiptap` 住在 packages/node_modules，它把整个 tiptap 家族声明成 **peer**
       * （含子路径 `@tiptap/extensions/character-count`、`@tiptap/vue-3/menus`），
       * 而 workspace 侧一个都没装 ⇒ 从该文件的位置往上找不到。
       * dev 能跑是因为 optimizeDeps 从应用根解析；build 的模块图按文件位置解析，所以只在 build 暴露。
       * 这里用 dedupe（按包名从应用根重解析，保留 exports 映射）——
       * 不能改成路径别名：别名会绕过包 exports，子路径会变成"找不到文件"。
       */
      dedupe: [
        'dayjs',
        'vue',
        'antdv-next',
        '@antdv-next/cssinjs',
        '@antdv-next/icons',
        'p-limit',
        '@tiptap/core',
        '@tiptap/pm',
        '@tiptap/starter-kit',
        '@tiptap/extensions',
        '@tiptap/vue-3',
        '@tiptap/extension-blockquote',
        '@tiptap/extension-bold',
        '@tiptap/extension-bullet-list',
        '@tiptap/extension-code',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-color',
        '@tiptap/extension-document',
        '@tiptap/extension-font-family',
        '@tiptap/extension-hard-break',
        '@tiptap/extension-heading',
        '@tiptap/extension-highlight',
        '@tiptap/extension-horizontal-rule',
        '@tiptap/extension-image',
        '@tiptap/extension-italic',
        '@tiptap/extension-link',
        '@tiptap/extension-list-item',
        '@tiptap/extension-ordered-list',
        '@tiptap/extension-paragraph',
        '@tiptap/extension-strike',
        '@tiptap/extension-table',
        '@tiptap/extension-task-item',
        '@tiptap/extension-task-list',
        '@tiptap/extension-text',
        '@tiptap/extension-text-align',
        '@tiptap/extension-text-style',
        '@tiptap/extension-underline',
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lint',
        '@codemirror/search',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/theme-one-dark',
        '@codemirror/lang-css',
        '@codemirror/lang-html',
        '@codemirror/lang-javascript',
        '@codemirror/lang-json',
        '@codemirror/lang-markdown',
        '@codemirror/lang-python',
        '@codemirror/lang-xml',
        '@codemirror/lang-yaml',
        'livekit-client',
      ],
      preserveSymlinks: true,
    },
    optimizeDeps: {
      exclude: ['@loncra/client', '@loncra/antdv', '@loncra/antdv-pro', '@loncra/antdv-chat', '@loncra/antdv-chat-pro', '@loncra/chat-core'],
      include: [
        'lowlight',
        'highlight.js',
        'highlight.js/lib/core',
        'p-limit',
      ],
      /**
       * rolldown 预构建在读取依赖时应用 depPatchPlugins（见文件顶部说明）。
       * 注意：`optimizeDeps.esbuildOptions` 在 rolldown-vite 下是被忽略的废弃项，补丁挂在那里不会生效。
       */
      rolldownOptions: {
        plugins: depPatchPlugins,
      },
    },
  }

})
