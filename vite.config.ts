import {fileURLToPath, URL} from 'node:url'

import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'

import tailwindcss from '@tailwindcss/vite'

import {AntdvNextResolver} from '@antdv-next/auto-import-resolver'
// vite.config.ts
import Components from 'unplugin-vue-components/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      vue(),
      tailwindcss(), Components({ resolvers: [AntdvNextResolver()] })
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        // 配置代理规则
        '/api': {
          target: env.VITE_APP_SERVER_URL, // 后端服务器地址
          changeOrigin: true, // 允许跨域
          rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，去掉 `/api` 前缀
        },
        '/socket.io': {
          target: env.VITE_APP_SERVER_URL, // 后端服务器地址
          changeOrigin: true, // 允许跨域
          ws: true, // WebSocket 代理
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
      dedupe: ['dayjs'],
    },
  }

})
