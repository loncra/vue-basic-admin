import {renderIconFont} from '@loncra/antdv'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_ROLE_AUTHORITY} from '@loncra/client/auth'
import {defineHomePage} from '@/components/basic/page'
import {AUTH_SERVER_ROLE_ROUTE} from '@/routers/auth-server/role'
import {SYSTEM_ENUM_TYPE, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {getEnumValue} from '@/utils'
import {ROLE_VARIANT, roleCore} from './role.page'

/** 角色列表（`Home.vue`）。核心在 `role.page.ts`，这里只写列表形态。 */
export const roleHomePage = defineHomePage<RoleSavePayload, RoleEntity>(roleCore, {
  authority: {
    add: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
    edit: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
    detail: AUTH_SERVER_ROLE_AUTHORITY.GET,
    delete: AUTH_SERVER_ROLE_AUTHORITY.DELETE,
  },
  enums: [SYSTEM_ENUM_TYPE.YES_OR_NO, SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM],
  rowSelection: {
    fixed: true,
    type: 'checkbox',
    getCheckboxProps: (record: Record<string, unknown>) => ({
      disabled: getEnumValue((record as unknown as RoleEntity).removable) === YES_OR_NO_TYPE.NO,
    }),
  },
  columns: [
    {key: 'name', width: 150, search: {component: 'input', expression: 'like'}},
    {key: 'authority', width: 150, search: {component: 'input', expression: 'like'}},
    // 当选择器用的时候（variant: 'picker'）不展示 sources
    {
      key: 'sources',
      width: 300,
      visible: ({variant}) => variant !== ROLE_VARIANT.PICKER,
      search: {component: 'select', expression: 'jin', props: {mode: 'multiple'}},
    },
    {key: 'removable', width: 150, search: {component: 'select', expression: 'eq'}},
    {key: 'modifiable', width: 150, search: {component: 'select', expression: 'eq'}},
    {key: 'enabled', width: 150, search: {component: 'select', expression: 'eq'}},
  ],
  rowActions: (ctx) => [
    {
      id: 'addChild',
      permission: AUTH_SERVER_ROLE_AUTHORITY.SAVE,
      label: () => ctx.t('common.addChild', {name: ''}),
      icon: () => renderIconFont('loncra-list-tree'),
      run: (actionCtx) => {
        if (actionCtx.record) {
          void ctx.router.push({
            name: AUTH_SERVER_ROLE_ROUTE.ADD_CHILD,
            query: {parentId: String(actionCtx.record.id)},
          })
        }
      },
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
