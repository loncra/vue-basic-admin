import dayjs, { type Dayjs } from 'dayjs'

/**
 * 格式化日期时间（通用函数）
 * 使用 dayjs 库将各种日期类型转换为指定格式的字符串
 *
 * @param value - 要格式化的日期值，可以是字符串、数字、Date 对象或 Dayjs 对象
 * @param format - 格式化模板字符串，例如 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串，如果值为空则返回空字符串
 *
 * @example
 * ```typescript
 * dayjsFormat(new Date(), 'YYYY-MM-DD') // "2024-01-01"
 * dayjsFormat('2024-01-01', 'YYYY年MM月DD日') // "2024年01月01日"
 * ```
 */
export function dayjsFormat(
  value: string | number | Date | Dayjs | null | undefined,
  format: string,
): string {
  // 如果值为空，返回空字符串
  if (!value || value === '') {
    return ''
  }

  // 如果已经是 dayjs 对象，直接格式化
  if (dayjs.isDayjs(value)) {
    return value.format(format)
  }

  // 否则转换为 dayjs 对象后格式化
  return dayjs(value).format(format)
}

/**
 * 格式化日期（仅日期部分）
 * 使用环境变量中配置的日期格式进行格式化
 *
 * @param value - 要格式化的日期值
 * @returns 格式化后的日期字符串，例如 "2024-01-01"
 */
export function dateFormat(value: string | number | Date | Dayjs | null | undefined): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_DATE_VALUE_FORMAT)
}

/**
 * 格式化日期时间（包含日期和时间）
 * 使用环境变量中配置的日期时间格式进行格式化
 *
 * @param value - 要格式化的日期值
 * @returns 格式化后的日期时间字符串，例如 "2024-01-01 12:00:00"
 */
export function dateTimeFormat(value: string | number | Date | Dayjs | null | undefined): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_DATE_TIME_VALUE_FORMAT)
}

/**
 * POST 请求日期格式
 * 用于向后端发送 POST 请求时的日期格式转换
 * 使用环境变量中配置的 POST 日期格式
 *
 * @param value - 要格式化的日期值
 * @returns 格式化后的日期字符串
 */
export function postDateFormat(value: string | number | Date | Dayjs | null | undefined): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_POST_DATE_FORMAT)
}

/**
 * POST 请求日期时间格式
 * 用于向后端发送 POST 请求时的日期时间格式转换
 * 使用环境变量中配置的 POST 日期时间格式
 *
 * @param value - 要格式化的日期值
 * @returns 格式化后的日期时间字符串
 */
export function postTimestampFormat(
  value: string | number | Date | Dayjs | null | undefined,
): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_POST_DATETIME_FORMAT)
}
