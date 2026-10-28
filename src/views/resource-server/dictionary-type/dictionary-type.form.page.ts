import type {DictionaryTypeSavePayload} from '@loncra/client/resource'
import {defineFormPage, type PageFieldRenderContext} from '@loncra/antdv-pro'
import {dictionaryTypeCore} from './dictionary-type.page'

export function emptyDictionaryTypeEntity(): DictionaryTypeSavePayload {
  return {
    code: '',
    name: '',
    id: null as unknown as number,
    version: null as unknown as number,
  }
}

export const dictionaryTypeFormPage = defineFormPage(dictionaryTypeCore, {
  createEntity: emptyDictionaryTypeEntity,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}],col: {span: 24}},
    {
      key: 'code',
      component: 'input',
      rules: [{required: true}],
      col: {span: 24},
      slots: {
        prefix: (_value: unknown, ctx: PageFieldRenderContext<DictionaryTypeSavePayload>) =>
          ctx.extra.parentCode ? `${ctx.extra.parentCode}.` : null,
      },
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      labelKey:'common.remark',
      props: {rows: 3, showCount: true, maxlength: 256},
    },
  ],
  preMounted: (ctx) => {
    const parentId = ctx.extra.parentId
    if (typeof parentId === 'number') {
      ctx.entity.value.parentId = parentId
    }
  },
})
