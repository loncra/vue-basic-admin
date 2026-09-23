import type {Ref} from 'vue'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {applySources, roleCore} from './role.page'

/** 角色新增/编辑（`Form.vue`）。核心在 `role.page.ts`，这里只写表单形态。 */
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
      // 选 / 清来源 → 让下面的「独立资源」表按 sources 过滤（原来 @change="sourceChange" 的行为）
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
      span: 24,
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  // 标题不在这里：`titleText` 没进 pro（"怎么写标题"是宿主的事）⇒ 拼装在 `Form.vue` 的
  // `useEntityPageTitle` 里（父角色名 / 实体名的分支照旧）。
  // addChild 入口：把父角色的可选择资源带过来
  preMounted: async (ctx) => {
    // pro 的上下文不带 router（宿主环境不进声明上下文）⇒ 声明文件自己 import 宿主 router
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
  /**
   * 重置回到初值。
   *
   * `sources` 的 `props.onChange` 只在**用户改选**时触发，重置不会进它（受控组件外部改值不 emit change），
   * 所以重置要在钩子里自己做三件事：清 `sources`、清资源勾选（`resourceIds` 不是表单字段，antd 管不到），
   * 再让资源表按「没选来源」清空（`applySources` 里那条分支）。
   */
  onReset: (ctx) => {
    const entity = ctx.entity?.value
    if (entity) {
      entity.sources = []
      entity.resourceIds = []
    }
    applySources(ctx, [])
  },
})
