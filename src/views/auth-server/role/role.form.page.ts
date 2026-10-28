import type {Ref} from 'vue'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {applySources, roleCore} from './role.page'

export const roleFormPage = defineFormPage<RoleSavePayload, RoleEntity>(roleCore, {
  createEntity: () => ({
    id: null as unknown as number,
    version: null as unknown as number,
    enabled: 1,
    sources: [],
    resourceIds: [],
    removable: 1,
    modifiable: 1,
    parentId: null as unknown as number,
    name: '',
    authority: '',
    remark: '',
  }),
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {key: 'authority', component: 'input', rules: [{required: true}]},
    {
      key: 'sources',
      component: 'select',
      rules: [{required: true, trigger: 'change', type: 'array'}],
      props: (ctx) => ({
        mode: 'multiple',
        onChange: (value: unknown) => applySources(ctx, value),
      }),
    },
    {key: 'removable', component: 'select'},
    {key: 'modifiable', component: 'select'},
    {key: 'enabled', component: 'select'},
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  preMounted: async (ctx) => {
    const parentId = router.currentRoute.value.query.parentId
    if (!parentId) {
      return
    }
    const result = await roleCore.service.get(parentId as never)
    const parent = result.data
    if (!parent) {
      return
    }
    const parentRef = ctx.extra.parent as Ref<RoleEntity | undefined> | undefined
    if (parentRef) {
      parentRef.value = parent
    }
    const entity = ctx.entity?.value
    if (!entity) {
      return
    }
    entity.parentId = parent.id
    entity.sources = parent.sources
    entity.resourceIds = parent.resourceIds
    entity.removable = parent.removable
    entity.modifiable = parent.modifiable
    applySources(ctx, parent.sources)
  },
  postGetEntity: (entity, ctx) => {
    applySources(ctx, entity.sources)
    return entity
  },
  onReset: (ctx) => {
    const entity = ctx.entity?.value
    if (entity) {
      entity.sources = []
      entity.resourceIds = []
    }
    applySources(ctx, [])
  },
})
