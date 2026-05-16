import type {NameValueEnumMetadata} from "@/types";

export type EnumBucketsResponseBody = Record<string, Record<string, NameValueEnumMetadata<number | string>[]>>

export type EnumBucketsRequestBody = Record<string, {
  id:string,
  value?: string[],
}[]>

