import {renderIconFont} from '@/utils/commonUtils'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_ROLE_AUTHORITY} from '@loncra/client/auth'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {AUTH_SERVER_ROLE_ROUTE} from '@/routers/auth-server/role'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME, YES_OR_NO_TYPE, getEnumValue} from '@loncra/client/commons'
import {defineSearchProps} from '@/utils'
import {ROLE_VARIANT, roleCore} from './role.page'

/** 加子级：跳到 addChild 路由，把当前行当父级（`run` 只接线，实现放这儿） */
function addChild(ctx: RecordActionContext<RoleEntity>): void {
  const record = ctx.record
  if (record) {
    void router.push({
      name: AUTH_SERVER_ROLE_ROUTE.ADD_CHILD,
      query: {parentId: String(record.id)},
    })
  }
}

/** 角色列表（`Home.vue`）。核心在 `role.page.ts`，这里只写列表形态。 */
export const roleHomePage = defineHomePage<RoleSavePayload, RoleEntity>(roleCore, {
  authority: {
    add: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
    edit: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
    detail: AUTH_SERVER_ROLE_AUTHORITY.GET,
    delete: AUTH_SERVER_ROLE_AUTHORITY.DELETE,
  },
  rowSelection: {
    fixed: true,
    type: 'checkbox',
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled: getEnumValue((record as unknown as RoleEntity).removable) === YES_OR_NO_TYPE.NO,
    }),
  },
  columns: [
    {key: 'name', width: 150, search: defineSearchProps('input')},
    {key: 'authority', width: 150, search: defineSearchProps('input')},
    // 当选择器用的时候（variant: 'picker'）不展示 sources
    {
      key: 'sources',
      width: 300,
      visible: ({variant}) => variant !== ROLE_VARIANT.PICKER,
      search: defineSearchProps('select', {expression: 'jin', props: {mode: 'multiple'}}),
    },
    {key: 'removable', width: 150, search: defineSearchProps('select')},
    {key: 'modifiable', width: 150, search: defineSearchProps('select')},
    {key: 'enabled', width: 150, search: defineSearchProps('select')},
  ],
  recordActions: (ctx) => [
    {
      id: 'addChild',
      permission: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
      label: () => i18n.global.t('common.addChild', {name: ''}),
      icon: () => renderIconFont('loncra-list-tree'),
      run: addChild,
    },
    ...(ctx.variant === ROLE_VARIANT.PICKER
      ? []
      : [
          {
            id: 'edit',
            visible: (actionCtx: {record?: RoleEntity}) =>
              getEnumValue(actionCtx.record!.modifiable) !== YES_OR_NO_TYPE.NO,
          },
          {
            id: 'delete',
            visible: (actionCtx: {record?: RoleEntity}) =>
              getEnumValue(actionCtx.record!.removable) !== YES_OR_NO_TYPE.NO,
          },
        ]),
  ],
})
