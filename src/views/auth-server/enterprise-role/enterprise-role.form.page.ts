import {ref} from 'vue'
import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {enterpriseRoleCore} from './enterprise-role.page'

/**
 * addChild 入口带过来的父角色：`preMounted` 里填，页壳用它拼标题（旧 `setPageTitle` 的第一个分支）。
 * 声明要打开壳里的东西就导出模块级状态 —— 与 `enterprise-invitation` 的分享弹层同款接缝。
 */
export const enterpriseRoleParent = ref<EnterpriseRoleEntity>()

/**
 * 企业角色新增/编辑（`Form.vue`）。核心在 `enterprise-role.page.ts`，这里只写表单形态。
 *
 * 三处照旧：
 * - 三个 v1 字段是 `select`，选项来自核心字典的 `enumRef`（`YES_OR_NO`，resource-server）；
 * - `addChild`（带 `parentId` 进来）把父角色的**可继承项**带过来：`resourceIds` / `removable` /
 *   `modifiable`（旧 `mounted()` 里那三行）；
 * - 重置要把 `resourceIds` 清掉（它不在表单字段里，antd 管不到 —— 同 `role.form.page.ts` 的教训）。
 */
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
    {key: 'removable', component: 'select'},
    {key: 'modifiable', component: 'select'},
    {key: 'enabled', component: 'select'},
    // `remark` 不在这里：旧页面的它在「独立资源」表**下面**（不在字段行里）⇒ 由 `Form.vue`
    // 的默认插槽渲染（同 `console-user/Form.vue` 的做法），位置与旧页面一致。
  ],
  // 标题不在这里（`titleText` 没进 pro）⇒ 拼装在 `Form.vue` 的 `useEntityPageTitle` 里（父角色名优先）
  preMounted: async (ctx) => {
    // pro 的声明上下文不带 router（宿主环境不进声明）⇒ 声明文件自己 import 宿主 router
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
