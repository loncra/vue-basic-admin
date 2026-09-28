import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY, AUTH_SERVER_ENTERPRISE_ROLE_ROUTE, YES_OR_NO_TYPE} from '@/constants'
import {enterpriseRoleCore} from './enterprise-role.page'

/** 加子角色：跳到 addChild 路由，把当前行当父级（`run` 只接线，实现放这儿） */
function addChild(ctx: RecordActionContext<EnterpriseRoleEntity>): void {
  const record = ctx.record
  if (record?.id == null) {
    return
  }
  void router.push({
    name: AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.ADD_CHILD,
    query: {parentId: String(record.id)},
  })
}

/**
 * 企业角色列表（`Home.vue`）。核心在 `enterprise-role.page.ts`，这里只写列表形态。
 *
 * 照抄旧 `EnterpriseRoleTable.vue`：
 * - 五个列（name / authority 模糊搜，三个 v1 字段宽 150、下拉精确搜）—— 三个 v1 字段的
 *   `format: 'enum'` 与 `enumRef` 写在核心字典里，所以这里只需要 `search`；
 * - `addChild` 是自定义动作（旧 `actionButtons`）；编辑 / 删除的 `visible` 用
 *   `modifiable` / `removable` 判（旧 `Home.vue` 传的 `rowActions`）；
 * - 跳转由声明里的 `routes` 接管（`CrudConfig.onNavigate` 兜底带 `id`）。
 *
 * 嵌入用法（企业成员的「角色」表、邀请弹层的选角色）在壳上给 `:record-actions="false"`
 * 就等价于旧组件的 `preview`。
 */
export const enterpriseRoleHomePage = defineHomePage<EnterpriseRoleSavePayload, EnterpriseRoleEntity>(
  enterpriseRoleCore,
  {
    authority: {
      add: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
      edit: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
      detail: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.GET,
      delete: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.DELETE,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {key: 'name', ellipsis: true, search: defineSearchProps('input')},
      {key: 'authority', ellipsis: true, search: defineSearchProps('input')},
      {key: 'removable', width: 150, ellipsis: true, search: defineSearchProps('select')},
      {key: 'modifiable', width: 150, ellipsis: true, search: defineSearchProps('select')},
      {key: 'enabled', width: 150, ellipsis: true, search: defineSearchProps('select')},
    ],
    recordActions: [
      {
        id: 'addChild',
        permission: AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY.SAVE,
        label: () => i18n.global.t('common.addChild', {name: ''}),
        icon: () => renderIconFont('loncra-list-tree'),
        run: addChild,
      },
      // 下面两条是**默认动作**（编辑 / 删除）的字段级覆盖：只改 `visible`，其余照默认
      {
        id: 'edit',
        visible: (ctx) => getEnumValue(ctx.record!.modifiable) !== YES_OR_NO_TYPE.NO,
      },
      {
        id: 'delete',
        visible: (ctx) => getEnumValue(ctx.record!.removable) !== YES_OR_NO_TYPE.NO,
      },
    ],
  },
)
