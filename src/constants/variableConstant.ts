/**
 * 系统枚举类型常量
 *
 * 收纳所有通过 {@link ResourceServerService.getServiceEnumerates} 查询的枚举名（id 值），
 * 避免在各视图中硬编码魔法值字符串。
 */
export const SYSTEM_ENUM_TYPE = {
  BATCH_MESSAGE_TYPE_ENUM: 'BatchMessageTypeEnum',
  CLOUD_CHANNEL_ENUM: 'CloudChannelEnum',
  CAROUSEL_TYPE_ENUM: 'CarouselTypeEnum',
  DATA_STATUS_ENUM: 'DataStatusEnum',
  EXECUTE_STATUS: 'ExecuteStatus',
  GENDER_ENUM: 'GenderEnum',
  MCP_PACKAGE_AUTH_MODE_ENUM: 'McpPackageAuthModeEnum',
  MCP_PACKAGE_TYPE_ENUM: 'PackageTypeEnum',
  MCP_CLIENT_TYPE_ENUM: 'McpClientTypeEnum',
  MESSAGE_TYPE_ENUM: 'MessageTypeEnum',
  PACKAGE_ORIGIN_ENUM: 'PackageOriginEnum',
  MODEL_TYPE_ENUM: 'ModelTypeEnum',
  OPERATION_DATA_TYPE: 'OperationDataType',
  RESOURCE_CATEGORY_ENUM: 'ResourceCategoryEnum',
  RESOURCE_SOURCE_ENUM: 'ResourceSourceEnum',
  RESOURCE_TYPE_ENUM: 'ResourceTypeEnum',
  SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM: 'SiteMessagePushableChannelEnum',
  TIME_UNIT_ENUM: 'TimeUnitEnum',
  USER_STATUS: 'UserStatus',
  VALUE_TYPE_ENUM: 'ValueTypeEnum',
  YES_OR_NO: 'YesOrNo',
} as const

export const TIME_UNIT_TYPE = {
  /**
   * Time unit representing one thousandth of a microsecond.
   */
  NANOSECONDS: "NANOSECONDS",
  /**
   * Time unit representing one thousandth of a millisecond.
   */
  MICROSECONDS: "MICROSECONDS",
  /**
   * Time unit representing one thousandth of a second.
   */
  MILLISECONDS: "MILLISECONDS",
  /**
   * Time unit representing one second.
   */
  SECONDS: "SECONDS",
  /**
   * Time unit representing sixty seconds.
   */
  MINUTES: "MINUTES",
  /**
   * Time unit representing sixty minutes.
   */
  HOURS: "HOURS",
  /**
   * Time unit representing twenty four hours.
   */
  DAYS: "DAYS",
}

export const YES_OR_NO_TYPE = {
  YES:1,
  NO:0
} as const

/** 对齐后端 DataStatusEnum */
export const DATA_STATUS = {
  NEW: 10,
  RELEASE: 20,
  REVOKE: 30,
} as const

/** 对齐后端 PackageTypeEnum */
export const PACKAGE_TYPE = {
  SYSTEM: 10,
  HUB: 20,
} as const

/** 对齐后端 ExecuteStatus（`SYSTEM_ENUM_TYPE.EXECUTE_STATUS` 是枚举类名） */
export const EXECUTE_STATUS_TYPE = {
  PENDING: -1,
  PROCESSING: 0,
  SUCCESS: 1,
  RETRYING: 2,
  IGNORE: 3,
  FAILURE: 99,
  UNKNOWN: 404,
} as const

/** 对齐 McpClientTypeEnum.getName() */
export const MCP_CLIENT_TYPE = {
  SSE: 'sse',
  STDIO: 'stdio',
  STREAMABLE_HTTP: 'streamableHttp',
} as const

/** 对齐后端 CarouselTypeEnum */
export const CAROUSEL_TYPE = {
  PC: 10,
  APP: 20,
  APPLET: 30,
} as const

/** 对齐后端 ValueTypeEnum */
export const VALUE_TYPE = {
  INTEGER: 10,
  DOUBLE: 20,
  STRING: 30,
  DATE: 40,
  DATE_TIME: 50,
  TIME: 60,
} as const

/** 助手消息 content 块 type（对齐后端 AgentContentType） */
export const AGENT_CONTENT_TYPE = {
  THINK: "think",
  TOOL:"tool",
  ANSWER:"answer",
  ERROR:"error",
  AGENT_STATUS_CHANGE:"agentStatusChange",
  TOKEN_USAGE:"tokenUsage",
  STREAM_START:"streamStart",
  STREAM_STOP:"streamStop",
  STREAM_END:"streamEnd",
  ASSISTANT:"assistant",
  GENERATE_CONVERSATION_NAME:"generateConversationName"
} as const

export const AGENT_CONVERSATION_TYPE = {
  DEFAULT_WORKSPACE:10,
  CUSTOMIZE_WORKSPACE:20,
  WORKSPACE_CONVERSATION:30
} as const

export const AGENT_CHAT_STATUS = {
  READY:10,
  RUNNING:20,
  REQUEST_STOP:25,
  STOPPED:30,
  COMPLETED:35,
  FAILED:40
} as const

/** 助手 content 块 status */
export const AGENT_BLOCK_STATUS = {
  READY:'ready',
  PENDING:'pending',
  RUNNING: 'running',
  DONE: 'done',
  FAILED: 'failed',
} as const

export const MODEL_TYPE = {
  CHAT:10,
  IMAGE:20,
  VIDEO:30,
  VOICE:40,
  MUSIC:50,
} as const

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

export const AGENT_TOOL_BLOCK_STATUS = {
  PENDING:"pending",
  ASKING:"asking",
  ALLOWED:"allowed",
  SUBMITTED:"submitted",
  FINISHED:"finished",
} as const

export const CHAT_CALL_TYPE = {
  VIDEO:"10",
  VOICE:"20"
} as const

/** 通话场景：决定布局与采集档位（与 type 视频/语音正交） */
export const CHAT_CALL_SCENE = {
  PRIVATE: 10,
  GROUP: 20,
  MEETING: 30
} as const

/** 对齐后端 MessageTypeEnum */
export const MESSAGE_TYPE = {
  NOTICE: 10,
  WARNING: 20,
  SYSTEM: 30,
  CAPTCHA: 40,
  PROMOTION: 50,
  IM: 60,
  UNKNOWN: 99,
} as const
