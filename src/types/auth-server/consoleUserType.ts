import type {
  AbstractPlatformUser,
  NameValueEnumMetadata,
  UserInitializationMetadata
} from "@/types";

/**
 * 资源数据类型
 * @author maurice.chen
 */
export interface ConsoleUserEntity extends AbstractPlatformUser {
  realName:string,
  gender:NameValueEnumMetadata<number>
  phoneNumber:string
  phoneNumberVerified?:NameValueEnumMetadata<number>
  initialization?: UserInitializationMetadata
  remark: string
}
