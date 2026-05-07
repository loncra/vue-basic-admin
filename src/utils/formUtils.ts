import dayjs from 'dayjs'
import { dayjsFormat } from './dateUtils'

/**
 * 值转换函数类型
 * 用于在表单编码过程中对特定字段的值进行自定义转换
 *
 * @param key - 字段名称
 * @param value - 字段原始值
 * @returns 转换后的值
 */
type ValueConvertFn = (key: string, value: unknown) => unknown

/**
 * 将 JSON 对象转换为 URLSearchParams 格式
 * 用于构建 URL 查询参数或表单编码数据
 * 支持忽略指定属性、值转换和数组处理
 *
 * @param json - 要转换的 JSON 对象
 * @param ignoreProperties - 要忽略的属性名，可以是单个字符串或字符串数组
 * @param valueConvert - 可选的值转换函数，用于对特定字段的值进行自定义转换
 * @returns URLSearchParams 对象，可直接用于 URL 或表单提交
 *
 * @example
 * ```typescript
 * const params = formUrlEncoded(
 *   { name: 'John', age: 30, ignoreMe: 'value' },
 *   ['ignoreMe'],
 *   (key, val) => key === 'age' ? val.toString() : val
 * );
 * // 结果: name=John&age=30
 * ```
 */
export function formUrlEncoded(
  json: Record<string, unknown>,
  ignoreProperties?: string | string[],
  valueConvert?: ValueConvertFn,
): URLSearchParams {
  const param = new URLSearchParams()

  // 处理忽略属性列表
  let ignore: string[] = []

  if (typeof ignoreProperties === 'string') {
    ignore.push(ignoreProperties)
  } else {
    ignore = ignoreProperties || []
  }

  // 遍历对象属性
  for (const j in json) {
    // 跳过忽略的属性
    if (ignore.includes(j)) {
      continue
    }

    let val = json[j]

    // 跳过 undefined 和 null 值
    if (val === undefined || val === null) {
      continue
    }

    // 应用值转换函数（如果提供）
    if (valueConvert) {
      val = valueConvert(j, val)
    }

    // 处理数组：数组的每个元素都作为单独的参数值
    if (Array.isArray(val)) {
      val.forEach((v) => param.append(j, convertFormUrlencoded(v) as string))
    } else {
      param.append(j, convertFormUrlencoded(val) as string)
    }
  }

  return param
}

/**
 * 转换表单 URL 编码值
 * 主要用于将 dayjs 日期对象转换为字符串格式
 * 其他类型的值直接返回原值
 *
 * @param val - 要转换的值
 * @returns 转换后的值，dayjs 对象会被转换为字符串，其他类型保持不变
 */
export function convertFormUrlencoded(
  val: unknown,
): string | number | boolean | null | undefined | unknown {
  // 如果是 dayjs 日期对象，转换为指定格式的字符串
  if (dayjs.isDayjs(val)) {
    return dayjsFormat(val, import.meta.env.VITE_APP_POST_DATETIME_FORMAT)
  }

  // 其他类型直接返回
  return val
}
