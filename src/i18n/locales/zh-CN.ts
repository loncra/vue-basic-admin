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
    setting:'设置',
    me: '我',
    noMore:'没有更多的数据了',
    creationTime:'创建时间',
    link:'链接地址',
    ip:'IP 地址',
    system:'系统信息',
    save: '保存',
    add: '添加{name}',
    edit: '编辑{name}',
    all: '全部{name}',
    used:'已使用',
    export: {
      all: '导出全部',
      selected: '导出 ({count}) 条记录',
    },
    detail: '{name}详情',
    action: '操作',
    reset: '重置',
    read:{
      time:'读取时间',
      readable: '未读{count}',
      unreadable: '已读{count}',
    },
    delete:{
      text:'删除',
      selected: '删除 ({count}) 条记录',
      confirmTitle: '删除确认',
      confirmSingle: '确定要删除该记录吗？',
      confirmBatch: '确定要删除 {count} 条记录吗？',
    },
    title:'标题',
    serverError: '服务器异常，请稍后在试。',
    confirmPassword:'确认密码',
    email: '电子邮箱',
    phoneNumber: '手机号码',
    status: '状态',
    content:'内容',
    gender: '性别',
    remark: '备注',
    unSupport:'您的浏览器不支此操作',
    realName: '真实姓名',
    send: '发送{name}',
    name:'名称',
    enabled: '启用',
    verified: '是否认证{name}',
    disabled: '禁用',
    type:'类型',
    category:'类别',
    back: '返回',
    home: '首页',
    parent:'父类',
    addChild:'添加{name}子级',
    open:'开启',
    close:'关闭',
    border:'边框',
    size:'大小',
    lang: '语言',
    style:'风格',
    other:'其他',
    owner:'所属用户',
    rememberOperate:'记住我的操作',
    default:'默认',
    basicInformation: '基础信息',
    request:{
      header:'请求头',
      parameter:'请求参数',
      body:'请求体'
    },
    cover:'封面',
    sort:'排序值',
    value: '值',
    unname:'未命名',
    clear:'清空',
    executeStatus:'执行状态',
    successTime:'成功时间',
    completionTime:'完成时间',
    expiresTime:'过期时间',
    auditionTime:'审核时间',
    code:'代码',
    retry:{
      time:'重试时间',
      count:'重试次数'
    },
    channel:'渠道',
    download:{
      text:'下载',
      selected:'下载选中 ({count}) 条记录'
    },
    release:{
      text:'发布',
      selected: '发布 ({count}) 条记录',
      confirmTitle:'发布确认',
      confirmSingle:'确定要发布该记录吗？',
      confirmBatch:'确定要发布 {count} 条记录吗？',
    },
    revoke:{
      text:'撤销',
      selected: '撤销 ({count}) 条记录',
      confirmTitle:'撤销确认',
      confirmSingle:'确定要撤销该记录吗？',
      confirmBatch:'确定要撤销 {count} 条记录吗？',
    },
  },
  operation:{
    time:'操作时间',
    principal:'操作账户',
    type:'操作类型',
    data:'操作数据'
  },
  systemSetting: {
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
    },
    account:{
      avatar:{
        supportFormat:'仅支持上传 jpeg, png, jpg, bmp 的图片',
        supportSize:'图片必须小于 1MB!',
        history: '历史图片'
      },
      modifyPassword:'修改密码'
    },
    tab:{
      accountSetting:'账户设置',
      configProviderSetting:'系统设置'
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
    notNull:'不能为空',
    errorMessage:'错误信息',
    code:'错误代码',
    field:'字段信息',
    valid:{
      phoneNumber:'手机号码格式不正确',
      password:'密码段中在要求的四种(大写字母，小写字母，数字，标点符号)类型中至少存在三种'
    },
    notEq:'{target}与{source}不一致',
    badRequest:{
      page:'参数错误',
      title:'您提交的参数错误',
    },
    forbidden:{
      page:'没有权限访问',
      title:'您没有权限访问,请联系管理员开通权限',
    },
    notFound:{
      page:'找不到页面',
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
  attachment: {
    text:'附件',
    uploading: '文件上传中...',
    dragger:{
      title:'点击或拖动文件至该区域进行上传',
      subTitle:'可上传 {maxCount} 个文件内容，当前已上传 {count}'
    },
    type:{
      image:'图片',
      video:'视频',
      audio:'音频',
      unknown:'文件'
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
    principal:'用户信息',
    account: '登录账户',
    password: '登录密码',
    oldPassword:'旧密码',
    newPassword:'新密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码?',
    login: '登录',
    log:'登录日志',
    phoneLogin: '手机号码登录',
    qrCodeLogin: '扫码登录',
    noAccount: '没有账户？',
    createAccount: '创建账户',
    reLogin:'重新登录',
    page:'用户登录'
  },
  workbench: {
    personalActivity: '个人动态',
    quickAccess: '快速入口',
  },
  authServer:{
    deviceIdentified:'设备唯一识别',
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
      icon:'图标',
      routePage:'权限',
    },
    auditEvent:{
      type:'审计类型',
      target:'审计目标',
      traceId:'关联业务 id'
    },
    consoleUser: {
      routePage:'员工'
    },
    role:{
      routePage:'角色',
      removable:'是否可删除',
      modifiable:'是否可修改'
    }
  },
  resourceServer:{
    dataDictionary:{
      valueType:'值类型',
      level:'等级',
      routePage:'字典数据',
      editPage:'类型: {typeName}, 名称: {dataName}'
    },
    dictionaryType:{
      routePage:'字典类型'
    },
    attachment: {
      filename:'文件名称',
      fileSize:'文件大小',
      lastModified:'最后修改时间'
    },
    carousel: {
      image:'图片内容',
      dataContent:' 数据内容',
      routePage:'轮播图',
      showtime:'展示时间',
      immediately:'立即',
      permanent:'永久',
    }
  },
  messageServer:{
    sms:{
      routePage:'短信消息',
      template:{
        routePage:'短信模版管理',
        code:'短信模版'
      },
      sign:{
        routePage:'短信签名管理',
        code:'短信签名'
      },
      variable:{
        title:'模版变量'
      }
    },
    site:{
      pushable:'是否推送',
      routePage:'站内信消息',
      readable:'是否已读',
      readCount:'已读数量{count}',
      channel:'推送渠道',
      deleteRead:'删除已读',
      readAll:'设置全部为已读',
    },
    email:{
      routePage:'邮件消息',
      fromEmail:'发送邮箱',
      receiveEmail:'收信邮箱',
    },
    batch:{
      routePage:'批量消息',
      count:'总发送数量',
      successNumber:'成功数量{count}',
      failNumber:'失败数量{count}'
    }
  },
  component: {
    tiptap:{
      undo:'撤销',
      redo:'重做',
      picture:{
        text:'图片',
        label:'图片地址'
      },
      bold:'加粗',
      italic:'斜体',
      underline:'下划线',
      blockquote:'引用',
      text:'正文',
      link:{
        text:'链接',
      },
      title:'标题{number}',
      list:{
        none:'无列表',
        bullet:'无序列表',
        ordered:'有序列表'
      },
      align:{
        left:'左对齐',
        center:'居中对齐',
        right:'右对齐'
      }
    },
    systemUserPanel:{
      selectedMember:'已选择的成员'
    }
  },
  chat:{
    conversation:{
      delete:'删除会话'
    },
    pinned:{
      action:'置顶聊天',
      cancel:'取消置顶聊天'
    },
    muted:{
      action:'消息免打扰',
      cancel:'取消免打扰'
    },
    history: '聊天记录',
    view:{
      placeholder:{
        exitRoom:'您已退出本群',
        roomRemove:'您已被本群移除',
        disbandRoom:'本群已解散',
        text:'输入消息，可粘贴文件到此处发送文件内容'
      },
      readable:{
        jumpTo:'跳转至最早未读消息',
        systemMessage:'以下为最早未读消息'
      }
    },
    roomView:{
      addParticipant: '发起群聊',
      memberManager:'成员管理',
      exitRoom:{
        title:'退群提示',
        content: '确定要退出 {name} 群聊吗?',
        action:'退出群聊'
      },
      disbandRoom:{
        title:'解散提示',
        content: '确定要解散 {name} 群聊吗?',
        action:'解散群聊'
      },
      modal:{
        changeMember:'设置为成员',
        changeCoOwner:'设置为群管',
        removeMember:{
          confirmTitle:'移除成员确认',
          content:'确定要移除{count}个选中成员吗？',
          action:'移除成员'
        }
      }
    },
  }
}

export default locale
