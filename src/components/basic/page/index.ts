export {defineDetailPage, defineFormPage, defineHomePage} from './define'
export {default as CrudHomePage} from './CrudHomePage.vue'
export {default as CrudFormPage} from './CrudFormPage.vue'
export {default as CrudDetailPage} from './CrudDetailPage.vue'
/** 扩展点：内置的 formatter / 组件不够用时注册自己的（见 field.ts） */
export {defineFieldComponent, defineFormatter} from './field'
export type {FieldComponentSpec, ValueFormatter} from './field'
export type {
  CrudDetailDefinition,
  CrudFormDefinition,
  CrudHomeDefinition,
  CrudPageCore,
  PageContext,
  PageDetailDefinition,
  PageDetailEntry,
  PageDetailItem,
  PageEnums,
  PageFieldComponent,
  PageFieldRenderContext,
  PageFieldsDictionary,
  PageFieldSpec,
  PageFormDefinition,
  PageFormField,
  PageListColumn,
  PageListDefinition,
  PageListEntry,
  PageValueFormat,
} from './types'
