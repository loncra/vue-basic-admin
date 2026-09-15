import axios from 'axios'
import {createClient} from '@loncra/client'
import {createAxiosHttpClient} from '@loncra/client/adapters/axios'
import {convertFormUrlencoded} from '@/utils/commonUtils'

/**
 * 必须作为入口的第一个 import：ESM 会先跑完 main 的全部依赖（含路由里同步加载的页面/Service），
 * 再执行 main 函数体。createClient 若写在 main 里，顶层 `new XxxService()` 会先于初始化炸掉。
 * 这里只用 axios 单例，不经过 `@/requests`（后者会拉路由）。
 */
createClient({
  http: createAxiosHttpClient(axios),
  runtimeMode: import.meta.env.RUNTIME_MODE === 'MICROSERVICE' ? 'MICROSERVICE' : 'MONOLITH',
  getAccessToken: () => localStorage.getItem(import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME),
  resourcePath: import.meta.env.VITE_APP_RESOURCE_PATH,
  openAttachmentUrl: (url) => {
    window.open(url)
  },
  formValueConvert: (_key, value) => convertFormUrlencoded(value),
  uploadBlockSize: Number(import.meta.env.VITE_APP_UPLOAD_BLOCK_SIZE),
})
