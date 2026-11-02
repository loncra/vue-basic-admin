import {getEnumValue, type NameValueEnumMetadata, YES_OR_NO_TYPE} from '@loncra/client/commons'

export function yesOrNoToBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  const numeric = Number(getEnumValue(value as number | NameValueEnumMetadata<number>))
  if (numeric === YES_OR_NO_TYPE.YES) {
    return true
  }
  if (numeric === YES_OR_NO_TYPE.NO) {
    return false
  }
  return undefined
}

export function booleanToYesOrNo(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value ? YES_OR_NO_TYPE.YES : YES_OR_NO_TYPE.NO
  }
  const numeric = Number(getEnumValue(value as number | NameValueEnumMetadata<number>))
  if (numeric === YES_OR_NO_TYPE.YES || numeric === YES_OR_NO_TYPE.NO) {
    return numeric
  }
  return undefined
}
