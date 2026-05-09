import {createApp, createVNode} from 'vue'
import {createPinia} from 'pinia'

import App from '@/App.vue'
import router from '@/routers'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import i18n from '@/i18n'
// 导入 Ant Design Vue Next 组件和图标（antdv-next 无 List 组件，Chat.vue 中已用 div 替代）
import {createFromIconfontCN, ExclamationCircleOutlined} from '@antdv-next/icons'
import {message, Modal, notification} from 'antdv-next'
// 导入全局样式
import '@/assets/style.css'

dayjs.extend(relativeTime)

/**
 * 创建自定义图标字体组件
 * 使用阿里图标库的字体文件
 */
const IconFont = createFromIconfontCN({
  scriptUrl: [
    // 文件图标字体脚本
    '/font_system_icon/iconfont.js',
    '/font_xiaojiage/iconfont.js',
  ],
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.component('IconFont', IconFont)

// ==================配置全局属性================== //

/**
 * 全局消息提示
 */
app.config.globalProperties.$message = message

/**
 * 全局通知
 */
app.config.globalProperties.$notification = notification

/**
 * 全局路由实例
 */
app.config.globalProperties.$router = router

/**
 * 全局日期处理
 */
app.config.globalProperties.$dayjs = dayjs

/**
 * 全局确认对话框
 */
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
