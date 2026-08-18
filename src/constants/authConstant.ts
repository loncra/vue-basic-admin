/** 对齐后端 GenderEnum */
export const GENDER = {
  MALE: 10,
  FEMALE: 20,
  UNKNOWN: 30,
} as const

/** 对齐后端 ResourceCategoryEnum */
export const RESOURCE_CATEGORY = {
  PLUGIN: 10,
  CUSTOMIZE: 20,
} as const

/**
 * 资源类型常量
 * 用于标识权限资源的结构类型
 */
export const RESOURCE_TYPE = {
  /** 根节点 */
  ROOT: 'root',
  /** 目录（分组） */
  DIRECTORY: 'directory',
  /** 菜单项 */
  MENU: 'menu',
  /** 安全资源（接口权限等） */
  SECURITY: 'security',
  /** 工具栏 */
  TOOL: 'tool',
  /** 个人中心 */
  PROFILE: 'profile',
  /** 导航数据 */
  NAVIGATION_DATA: 'navigationData',
} as const

/**
 * 认证类型常量
 * 区分控制台用户与会员用户的认证方式
 */
export const AUTHENTICATION_TYPE = {
  /** 控制台/后台用户 */
  CONSOLE: 'CONSOLE',
  /** 前台会员用户 */
  MEMBER: 'MEMBER',
} as const

/**
 * 登录方式常量
 * 支持的登录验证方式
 */
export const LOGIN_TYPE = {
  /** 用户名密码登录 */
  USERNAME_PASSWORD: 'USERNAME_PASSWORD',
  /** 手机号登录 */
  PHONE_CAPTCHA: 'PHONE_CAPTCHA',
  /** 二维码登录 */
  QR_CODE: 'QR_CODE',
} as const


export const ROLE_AUTHORITY = {
  DELETE: 'perms[auth_server_role:delete]',
  GET: 'perms[auth_server_role:get]',
  SAVE:'perms[auth_server_role:save]',
} as const

export const RESOURCE_AUTHORITY = {
  DELETE: 'perms[auth_server_authority_resource:delete]',
  GET: 'perms[auth_server_authority_resource:get]',
  SAVE:'perms[auth_server_authority_resource:save]',
} as const

export const CONSOLE_USER_AUTHORITY = {
  DELETE: 'perms[auth_server_console_user:delete]',
  GET: 'perms[auth_server_console_user:get]',
  SAVE:'perms[auth_server_console_user:save]',
  EXPORT: 'perms[auth_server_console_user:export]',
} as const
