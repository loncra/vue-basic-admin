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
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
      dedupe: ['dayjs', 'vue', 'antdv-next'],
      preserveSymlinks: true,
    },
    optimizeDeps: {
      exclude: ['@loncra/client', '@loncra/antdv'],
      include: [
        'antdv-next-tiptap',
        'lowlight',
        'highlight.js',
        'highlight.js/lib/core',
      ],
    },
  }

})
