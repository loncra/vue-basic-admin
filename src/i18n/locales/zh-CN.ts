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
    id: '主键',
    save: '保存',
    add: '添加',
    edit: '编辑',
    delete: '删除',
    export: '导出',
    detail: '详情',
    action: '操作',
    deleteSelected: '删除选中',
    reset: '重置',
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
    disabled: '禁用',
    type:'类型',
    category:'类别',
    back: '返回',
    home: '首页',
    parent:'父类',
    addChild:'添加子级',
    open:'开启',
    close:'关闭',
    border:'边框',
    size:'尺寸',
    lang: '语言',
    style:'风格',
    other:'其他',
    rememberOperate:'记住我的操作',
    default:'默认',
    basicInformation: '基础信息',
  },
  operation:{
    time:'操作时间',
    principal:'操作账户',
    type:'操作类型',
    data:'操作数据'
  },
  setting: {
    componentSize:'组件默认大小设置',
    wireframe:'边框化',
    compact:'紧凑型',
    createSuccessBack:'创建记录成功后操作',
    borderRadius:'圆角',
    boxShadow:{
      text:'阴影',
      secondary:'2 级元素阴影',
      tertiary:'3 级元素阴影'
    },
    font:{
      text:'字号',
      heading:'{number} 级标题字号'
    },
    lineHeight: {
      text:'行高',
      heading:'{number} 级字号标签行高'
    },
    margin:'外间距',
    padding:'内间距',
    size:{
      common: '通用尺寸',
      large:'大',
      middle:'中',
      small:'小',
      lg:'大尺寸',
      md:'中大尺寸',
      sm:'中小尺寸',
      xl:'超大尺寸',
      xs:'小尺寸',
      xxl:'最大尺寸',
      xxs:'最小尺寸'
    },
    theme:{
      text:'主题',
      dark:'暗黑模式',
      light:'白昼模式',
      system:'跟随系统',
    },
    home: {
      homeSiderWidth:'首页侧边栏宽度',
      homeCollapsedWidth:'首页侧边栏折叠宽度',
    },
    other: {
      transparency:{
        text: '透明度',
        loading:'加载状态的透明度',
        image:'图片不透明度'
      }
    },
    colorSetting:{
      text:'颜色',
      prepare:'预设颜色',
      colorPrimary:'品牌色',
      colorSuccess:'成功色',
      colorError:'错误色',
      colorWarning:'警告色',
      other:{
        blue:'蓝色',
        purple:'紫色',
        cyan:'青蓝色',
        red:'红色',
        orange: '橙色',
        yellow: '黄色',
        green: '绿色',
        magenta: '品红色',
        pink:'粉色',
        volcano:'火山色',
        geekblue:'极客蓝',
        lime:'酸橙色',
        gold:'金色'
      },
      active: {
        title: '激活态',
        subTitle: '在该色梯度下，用于深色或高对比场景中的选中、按下等强调。',
      },
      bg: {
        title: '浅背景',
        subTitle: '同色系浅色底，多用于层级较弱的背景或弱化选中。',
      },
      bgHover: {
        title: '浅背景（悬停）',
        subTitle: '与浅背景成对的悬停色，用于可交互区域的 Hover 反馈。',
      },
      border: {
        title: '描边',
        subTitle: '该梯度下的轮廓色，常用于 Slider、输入框等描边。',
      },
      borderHover: {
        title: '描边（悬停）',
        subTitle: '描边在悬停时变化，用于 Button、Slider 等边框 Hover。',
      },
      hover: {
        title: '悬停态',
        subTitle: '该梯度下用于一般控件面或图标的悬停强调（非专用文本色）。',
      },
      colorText: {
        title: '文本色',
        subTitle: '该梯度下正文、辅助文案及图标的主用色。',
      },
      colorTextActive: {
        title: '文本（激活）',
        subTitle: '文本或链接在激活、选中状态下的颜色。',
      },
      colorTextHover: {
        title: '文本（悬停）',
        subTitle: '文本或链接在鼠标悬停时的颜色。',
      },
    }
  },
  form: {
    operationDataTrace:"操作记录",
    createSuccess: {
      title: '新增成功',
      subTitle: '请点击以下按钮进行后续操作',
      okReturnList: '返回列表',
      addAnother: '继续添加',
    }
  },
  error:{
    notNull:'{field} 不能为空',
    errorMessage:'错误信息',
    code:'错误代码',
    field:'字段信息',
    valid:{
      phoneNumber:'手机号码格式不正确',
    },
    badRequest:{
      title:'您提交的参数错误',
    },
    forbidden:{
      title:'您没有权限访问,请联系管理员开通权限',
    },
    notFound:{
      title:'找不到你想访问的页面'
    },
    staleEntityForm: {
      title: '页面内容已失效',
      subTitle: '找不到这条信息。若刚在别处删除过，请从列表重新进入。',
    },
  },
  search:{
    text:'搜索',
    placeholder:{
      input:'输入内容进行查询',
      select:'选择内容进行查询'
    }
  },
  layoutContent: {
    loading: '加载中...',
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
    reLogin:'重新登录',
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
    randomPassword: '是否随机密码',
    randomUsername: '是否随机登录账户',
    lastAuthenticationTime:'最后登录时间',
    authority:'权限值',
    source: '资源来源',
    userRole: '用户角色',
    standaloneResource: '独立资源',
    resource:{
      applicationName: '应用名称',
      page:'路由页面',
      icon:'图标'
    },
    auditEvent:{
      type:'审计类型',
      target:'审计目标',
      traceId:'关联业务 id'
    },
    role:{
      removable:'是否可删除',
      modifiable:'是否可修改'
    }
  }
}

export default locale
