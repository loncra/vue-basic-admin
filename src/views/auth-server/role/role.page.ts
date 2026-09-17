import type {Ref} from 'vue'
import {renderIconFont} from '@loncra/antdv'
import type {RoleEntity, RoleSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_ROLE_AUTHORITY, RoleService} from '@loncra/client/auth'
import {defineCrudPage} from '@/components/basic/page'
import {AUTH_SERVER_ROLE_ROUTE} from '@/routers/auth-server/role'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_CONSTANT,
  SYSTEM_ENUM_TYPE,
  YES_OR_NO_TYPE,
} from '@loncra/client/commons'
import {getEnumValue} from '@/utils'

const roleService = new RoleService()

/**
 * 宿主形态名。console-user 表单把角色表当选择器用，传 `variant: ROLE_VARIANT.PICKER`，
 * 宿主 import 这个常量，别写字面量。
 */
export const ROLE_VARIANT = {PICKER: 'picker'} as const

/**
 * 把「sources 变化」翻译成资源表的查询条件，并让表重新取数。
 * 上下文里的 ref 由页面壳（role/Form.vue、role/Detail.vue）通过 contextExtra 注入。
 *
 * **没选来源时一个字都不查**（清空表格）—— 这是原来 `@change="sourceChange"` 的行为，
 * 别省掉这个分支，否则「新增角色」一进来就把全部资源列出来。
 */
function applySources(ctx: {extra: Record<string, unknown>}, sources: unknown): void {
  const values = (Array.isArray(sources) ? sources : []).map((item) => String(getEnumValue(item as never)))
  const query = ctx.extra.resourceQuery as Ref<Record<string, unknown>> | undefined
  if (query) {
    query.value['filter_[sources_jin]'] = values
  }
  const table = ctx.extra.resourceTable as
    | Ref<{fetchDataSource?: () => void; clearDataSource?: () => void} | undefined>
    | undefined
  if (values.length === 0) {
    table?.value?.clearDataSource?.()
    return
  }
  table?.value?.fetchDataSource?.()
}

export const rolePage = defineCrudPage<RoleSavePayload, RoleEntity>({
  service: roleService,
  rowKey: SYSTEM_CONSTANT.ID_NAME,
  i18nPrefix: 'authServer.role',
  routes: {
    home: AUTH_SERVER_ROLE_ROUTE.HOME,
    add: AUTH_SERVER_ROLE_ROUTE.ADD,
    edit: AUTH_SERVER_ROLE_ROUTE.EDIT,
    detail: AUTH_SERVER_ROLE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ROLE,

  /** 字段字典：labelKey / format / enumId 只写一次，三种形态共用 */
  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    authority: {labelKey: 'authServer.authority'},
    sources: {
      labelKey: 'authServer.source',
      format: 'enumList',
      enumId: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM,
    },
    removable: {labelKey: 'authServer.role.removable', format: 'enum', enumId: SYSTEM_ENUM_TYPE.YES_OR_NO},
    modifiable: {labelKey: 'authServer.role.modifiable', format: 'enum', enumId: SYSTEM_ENUM_TYPE.YES_OR_NO},
    enabled: {labelKey: 'common.enabled', format: 'enum', enumId: SYSTEM_ENUM_TYPE.YES_OR_NO},
    remark: {labelKey: 'common.remark'},
  },

  list: {
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
  },

  form: {
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
    titleText: (title, entity, ctx) => {
      const parent = (ctx.extra.parent as Ref<RoleEntity | undefined> | undefined)?.value
      if (parent) {
        return `${title} (${parent.name})`
      }
      const value = entity as RoleEntity
      return value.id ? `${title} (${value.name})` : title
    },
    // addChild 入口：把父角色的可选择资源带过来
    preMounted: async (ctx) => {
      const parentId = ctx.router.currentRoute.value.query.parentId
      if (!parentId) {
        return
      }
      const result = await roleService.get(parentId as never)
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
  },

  detail: {
    column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
    titleText: (title, entity) => `${title} (${entity.name})`,
    postGetEntity: (entity, ctx) => {
      applySources(ctx, entity.sources)
      return entity
    },
    // 只写顺序与差异：labelKey / format 在字典里
    fields: ['id', 'name', 'authority', 'modifiable', 'removable', 'sources', 'enabled', 'remark'],
  },
})
