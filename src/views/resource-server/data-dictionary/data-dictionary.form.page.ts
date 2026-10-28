import {h, ref} from 'vue'
import {Input, TypographyText} from 'antdv-next'
import type {
  DataDictionaryEntity,
  DataDictionarySavePayload,
  DictionaryTypeEntity,
} from '@loncra/client/resource'
import {DictionaryTypeService} from '@loncra/client/resource'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {VALUE_TYPE} from '@loncra/client/commons'
import {dataDictionaryCore} from './data-dictionary.page'

const typeService = new DictionaryTypeService()

export const dictionaryFormContext = ref<{
  type?: DictionaryTypeEntity
  parent?: DataDictionaryEntity
}>({})

function codePrefix() {
  const prefix = dictionaryFormContext.value.type?.code ?? dictionaryFormContext.value.parent?.code
  return prefix ? h(TypographyText, {strong: true}, {default: () => `${prefix}.`}) : undefined
}

export const dataDictionaryFormPage = defineFormPage<
  DataDictionarySavePayload,
  DataDictionaryEntity
>(dataDictionaryCore, {
  createEntity: () => ({
    id: null as unknown as number,
    version: null as unknown as number,
    code: '',
    name: '',
    value: '',
    valueType: VALUE_TYPE.STRING,
    enabled: 1,
    typeId: null as unknown as number,
    parentId: null as unknown as number,
  }),
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'code',
      rules: [{required: true}],
      render: (ctx) =>
        h(
          Input,
          {
            value: ctx.entity.code,
            'onUpdate:value': (value: string) => (ctx.entity.code = value),
          },
          {prefix: () => codePrefix()},
        ),
    },
    {key: 'enabled', component: 'select'},
    {key: 'valueType', component: 'select'},
    {key: 'level', component: 'input'},
    {key: 'sort', component: 'number', props: {class: 'w-full'}},
    {
      key: 'value',
      component: 'textarea',
      col: {span: 24},
      rules: [{required: true}],
      props: {rows: 4, showCount: true, maxlength: 256},
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  preMounted: async (ctx) => {
    const {parentId, typeId} = router.currentRoute.value.query
    if (parentId) {
      const result = await dataDictionaryCore.service.get(parentId as never)
      if (result.data) {
        dictionaryFormContext.value = {...dictionaryFormContext.value, parent: result.data}
      }
      return
    }
    if (!typeId) {
      return
    }
    const result = await typeService.get(typeId as never)
    const type = result.data
    if (!type) {
      return
    }
    dictionaryFormContext.value = {...dictionaryFormContext.value, type}
    const entity = ctx.entity?.value
    if (entity) {
      entity.typeId = Number(type.id)
    }
  },
  postGetEntity: async (entity) => {
    if (entity.typeId == null) {
      return entity
    }
    const result = await typeService.get(entity.typeId as never)
    const type = result.data
    if (!type) {
      return entity
    }
    dictionaryFormContext.value = {...dictionaryFormContext.value, type}
    entity.code = (entity.code ?? '').replace(type.code + '.', '')
    return entity
  },
})
