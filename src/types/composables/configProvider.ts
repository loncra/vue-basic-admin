import type {NameValueEnumMetadata} from "@loncra/client/commons";
import {type CreateSuccessBackValue} from '@/constants';
import type {GlobalConfigProps} from "antdv-next/dist/notification/interface";
import type {ConfigOptions} from "antdv-next/dist/message/interface";
import type {AntdvConfigInitial} from "@loncra/antdv-pro";

export interface ConfigProviderStoredState extends AntdvConfigInitial{
  homeSiderWidth: number
  homeCollapsedWidth: number
  homeCollapsible: boolean
  createSuccessBack?: CreateSuccessBackValue
  messageConfig: ConfigOptions
  notificationConfig: GlobalConfigProps
}

export interface ConfigProviderState extends ConfigProviderStoredState {
  screen: NameValueEnumMetadata<number>
}
