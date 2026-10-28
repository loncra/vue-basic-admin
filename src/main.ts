import {createApp, createVNode} from 'vue'
import {createPinia} from 'pinia'
import App from '@/App.vue'
import router from '@/routers'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import i18n from '@/i18n'
import {createFromIconfontCN, ExclamationCircleOutlined} from '@antdv-next/icons'
import {message, Modal, notification} from 'antdv-next'
import '@/assets/style.css'

import '@/requests'

dayjs.extend(relativeTime)

const IconFont = createFromIconfontCN({
  scriptUrl: [
    '/font_loncra_icon/iconfont.js',
    '/font_ai_icon/iconfont.js',
    '/font_xiaojiage/iconfont.js',
  ],
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.component('IconFont', IconFont)


app.config.globalProperties.$message = message

app.config.globalProperties.$notification = notification

app.config.globalProperties.$router = router

app.config.globalProperties.$dayjs = dayjs

app.config.globalProperties.$confirm = function (
  config: string | Record<string, unknown>,
  ok?: () => void,
  cancel?: () => void,
) {
  const props: Record<string, unknown> = {
    icon: createVNode(ExclamationCircleOutlined),
    onOk: ok,
    onCancel: cancel,
  }

  if (typeof config === 'string') {
    props.title = config
  } else {
    Object.assign(props, config)
  }

  Modal.confirm(props)
}

app.mount('#app')
