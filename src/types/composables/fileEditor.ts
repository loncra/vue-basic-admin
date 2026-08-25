import type {MenuItemType} from "@v-c/menu/dist/interface.js";
import type {ObjectWriteResult} from "@/types/apis";
import {FOLDER_ADD_TYPE} from "@/constants";

export interface FileItem extends Omit<MenuItemType, 'type'> {
  content?: string | ObjectWriteResult,
  type?: typeof FOLDER_ADD_TYPE.FILE | typeof FOLDER_ADD_TYPE.FOLDER
  editing?: boolean
  readonly?: boolean
  original?:string
  children?: FileItem[]
}
