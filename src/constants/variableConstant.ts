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

/** 对齐 McpClientTypeEnum.getName() */
export const MCP_CLIENT_TYPE = {
  SSE: 'sse',
  STDIO: 'stdio',
  STREAMABLE_HTTP: 'streamableHttp',
} as const
