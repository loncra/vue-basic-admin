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
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // 源码别名后 peer 不再沿管理端 node_modules 往上找，显式指回本应用。
        'p-limit': fileURLToPath(new URL('./node_modules/p-limit', import.meta.url)),
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
      ],
      preserveSymlinks: true,
    },
    optimizeDeps: {
      exclude: ['@loncra/client', '@loncra/antdv', '@loncra/antdv-pro'],
      include: [
        'antdv-next-tiptap',
        'lowlight',
        'highlight.js',
        'highlight.js/lib/core',
        'p-limit',
      ],
    },
  }

})
