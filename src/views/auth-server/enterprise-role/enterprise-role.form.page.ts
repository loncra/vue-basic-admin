import {ref} from 'vue'
import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {enterpriseRoleCore} from './enterprise-role.page'

export const enterpriseRoleParent = ref<EnterpriseRoleEntity>()

export const enterpriseRoleFormPage = defineFormPage<
  EnterpriseRoleSavePayload,
  EnterpriseRoleEntity
>(enterpriseRoleCore, {
  createEntity: () => ({
    id: null as unknown as number,
    version: null as unknown as number,
    enabled: 1,
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
    {key: 'removable', component: 'select', col: {xs: 24, sm: 24, md: 8, lg: 8, xl: 8, xxl: 8}},
    {key: 'modifiable', component: 'select', col: {xs: 24, sm: 24, md: 8, lg: 8, xl: 8, xxl: 8}},
    {key: 'enabled', component: 'select', col: {xs: 24, sm: 24, md: 8, lg: 8, xl: 8, xxl: 8}},
  ],
  preMounted: async (ctx) => {
    const parentId = router.currentRoute.value.query.parentId
    if (!parentId) {
      return
    }
    const result = await enterpriseRoleCore.service.get(parentId as never)
    const parent = result.data
    if (!parent) {
      return
    }
    enterpriseRoleParent.value = parent
    const entity = ctx.entity?.value
    if (!entity) {
      return
    }
    entity.parentId = parent.id
    entity.resourceIds = parent.resourceIds
    entity.removable = parent.removable
    entity.modifiable = parent.modifiable
  },
  onReset: (ctx) => {
    const entity = ctx.entity?.value
    if (entity) {
      entity.resourceIds = []
    }
  },
})
