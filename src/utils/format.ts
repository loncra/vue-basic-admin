import dayjs from 'dayjs'
import {type DateLike, dayjsFormat} from '@loncra/antdv-pro'

export function convertFormUrlencoded(val: unknown): unknown {
  if (dayjs.isDayjs(val)) {
    return dayjsFormat(val, import.meta.env.VITE_APP_POST_DATETIME_FORMAT)
  }

  return val
}

export function postTimestampFormat(value: DateLike): string {
  return dayjsFormat(value, import.meta.env.VITE_APP_POST_TIMESTAMP_FORMAT)
}
