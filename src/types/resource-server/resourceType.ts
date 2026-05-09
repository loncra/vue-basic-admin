import type {IdValueMetadata} from "@/types";

export type EnumBucketsResponseBody = Record<string, Record<string, IdValueMetadata<string, string>[]>>

export type EnumBucketsRequestBody = Record<string, {
  id:string,
  value?: string[],
}[]>

