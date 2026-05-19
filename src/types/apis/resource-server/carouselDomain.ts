import type {
  IdValueMetadata,
  NameValueEnumMetadata,
  ObjectWriteResult,
  VersionEntityMetadata
} from "@/types/apis";
import type {Dayjs} from "dayjs";

/**
 * 字典类型保存请求体
 *
 * maurice.chen
 */
export interface CarouselSavePayload extends VersionEntityMetadata {

  /**
   * 名称
   */
  name: string;

  /**
   * 类型
   */
  type: NameValueEnumMetadata<number> | number;

  /**
   * 链接
   */
  link: IdValueMetadata<string, string>;

  /**
   * 顺序值
   */
  sort?: number;

  /**
   * 过期时间
   */
  expirationTime?: number| Dayjs;

  /**
   * 展示时间
   */
  showtime?: number | Dayjs;

  /**
   * 封面图片
   */
  cover?: ObjectWriteResult;

  /**
   * 备注
   */
  remark: string;
}

/**
 * 字典类型数据类型
 * @author maurice.chen
 */
export interface CarouselEntity extends CarouselSavePayload {

  /**
   * 状态
   */
  status?: NameValueEnumMetadata<number> | number;
}
