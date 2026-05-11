import zhCN from 'antdv-next/locale/zh_CN'
import type {LanguagePack} from '@/i18n'
import 'dayjs/locale/zh-cn'

const locale: LanguagePack = {
  value: 'zh-CN',
  fallbackLocale: true,
  name: '简体中文',
  dayjs: 'zh-CN',
  antDesign: zhCN,
  common: {
    save: '保存',
    add: '添加',
    edit: '编辑',
    delete: '删除',
    export: '导出',
    detail: '详情',
    deleteSelected: '删除选中',
    operation: '操作',
    reset: '重置',
    deleteConfirm: '确定要删除 [{name}] 记录吗？',
    deleteConfirmTitle: '删除确认',
    deleteConfirmSingle: '确定要删除该记录吗？',
    deleteConfirmBatch: '确定要删除 {count} 条记录吗？',
    serverError: '服务器异常，请稍后在试。',
    confirmPassword:'确认密码',
    email: '电子邮箱',
    phoneNumber: '手机号码',
    status: '状态',
    gender: '性别',
    remark: '备注',
    realName: '真实姓名',
    name:'名称',
    enabled: '启用',
    type:'类型',
    category:'类别'
  },
  search:{
    text:'搜索',
    placeholder:{
      input:'输入内容进行查询',
      select:'选择内容进行查询'
    }
  },
  layoutContent: {
    pin: '固定',
    unpin: '解除固定',
    reload: '刷新',
    fullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    close: {
      others: '关闭其他标签页',
      right: '关闭右侧标签页',
    },
  },
  profile: {
    logout: '退出登录',
  },
  auth: {
    title: '开箱即用的开发基础',
    subTitle: '通过配置式生成，快速构建企业级应用，让开发更高效、更专注',
    welcomeTitle: '欢迎回来👋🏻',
    welcomeSubTitle: '请输入您的账户信息，以开始使用系统。',
    account: '登录账户',
    password: '登录密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码?',
    login: '登录',
    phoneLogin: '手机号码登录',
    qrCodeLogin: '扫码登录',
    noAccount: '没有账户？',
    createAccount: '创建账户',
    lastAuthenticationTime: '最后登录时间'
  },
  workbench: {
    personalActivity: '个人动态',
    quickAccess: '快速入口',
  },
  ai: {
    greeting: '嗨! {name} 今天有什么可以帮您？',
    models: '模型',
    think: '深度思考',
    newChat: '新话题',
    network: '网络搜索',
    knowledge: '知识库搜索',
    send: '发送',
    stop: '停止',
    history: '聊天历史',
    tool: {
      arguments: '请求参数',
      responseData: '响应结果',
    },
    duration: '用时 {time} 秒',
    token: {
      total: '总消耗词元数: {value}',
      prompt: '输入解析提示词词元数: {value}',
      completion: '应答词元数: {value}',
    },
  },
  authServer:{
    authority:'权限值',
    source: '资源来源',
    userRole: '用户角色',
    userResource: '独立资源',
    resource:{
      applicationName: '应用名称',
      page:'路由页面'
    },
    role:{
      removable:'是否可删除',
      modifiable:'是否可修改'
    }
  }
}

export default locale
