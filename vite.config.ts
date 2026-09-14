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
      dedupe: ['dayjs', 'vue', 'antdv-next', 'p-limit'],
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
