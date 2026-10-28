import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY} from '@loncra/client/auth'
import {getEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import router from '@/routers'
import {defineSearchProps, renderIconFont} from '@/utils'
import {AUTH_SERVER_ENTERPRISE_ROLE_ROUTE} from '@/constants'
import {enterpriseRoleCore} from './enterprise-role.page'

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
