import {h, ref, type Ref} from 'vue'
import {Space, type TableProps} from 'antdv-next'
import type {RowSelectMethod} from 'antdv-next/dist/table/interface'
import {IconSelect, renderIconFont} from '@loncra/antdv'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_RESOURCE_CATEGORY, ResourceService} from '@loncra/client/auth'
import {findAllTreeNodes, findFirstTreeNode, unmergeTree} from '@loncra/client/commons'
import {
  AUTH_SERVER_RESOURCE_AUTHORITY,
  AUTH_SERVER_RESOURCE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_CONSTANT,
  SYSTEM_ENUM_TYPE,
} from '@/constants'
import {defineCrudPage} from '@/components/basic/page'
import {getEnumValue} from '@/utils'
import {loadIcon} from '@/utils/resourceUtils'
import type {IconfontJson} from '@/types/composables/common'
import type {DragPreviewContent} from "@loncra/antdv-pro";

const resourceService = new ResourceService()

/**
 * 宿主形态名。role 表单/详情、console-user 表单把资源表当选择器用，传 `variant: RESOURCE_VARIANT.PICKER`，
 * 宿主 import 这个常量，别写字面量。
 */
export const RESOURCE_VARIANT = {PICKER: 'picker'} as const

/** 图标清单（表单的 IconSelect 用）。懒加载一次，函数形态的 props 读它 */
const iconOptions = ref<IconfontJson[]>([])
const ICON_MANIFESTS = ['/font_loncra_icon/iconfont.json', '/font_xiaojiage/iconfont.json']

/** 插件类资源：名称/权限/来源不必填，编辑时也不允许改这几个字段 */
function isPlugin(entity: unknown): boolean {
  return (
    getEnumValue((entity as ResourceEntity | undefined)?.category) === AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN
  )
}

/** 名称单元格：图标 + 名称（列表与详情共用） */
function renderIconName(value: unknown, record: ResourceEntity) {
  return h(Space, null, () => [
    renderIconFont(record.icon || 'loncra-file', 'icon align'),
    String(value ?? ''),
  ])
}

/**
 * 「独立资源」选择器的勾选行为：**树形合并** —— 选父节点连带整棵子树，取消时连带祖先与后代，
 * 保证写回的 `resourceIds` 始终是树上的合法勾选集。
 *
 * 这套逻辑原本在 `components/auth-server/ResourceTable.vue` 里（`onResourceSelect` / `onResourceChange`
 * + `findParentNode`），移植时被我漏掉了，**别再删**。role 表单的资源选择器用这个函数。
 */
export function resourceTreeSelection(options: {
  /** 当前表格数据（要按树找祖先 / 子节点，所以取最新的 dataSource） */
  dataSource: () => ResourceEntity[]
  /** 当前已勾选的主键 */
  selectedIds: () => number[] | undefined
  /** 写回勾选结果 */
  onChange: (ids: number[]) => void
}): NonNullable<TableProps['rowSelection']> {
  function findParentNode(parentIds: number[]): ResourceEntity[] {
    const parentNode = findAllTreeNodes(
      (r) => parentIds.includes(Number(r.id)),
      options.dataSource(),
    )
    const ids = [
      ...new Set(parentNode.map((r) => r.parentId).filter((id): id is number => id != null)),
    ]
    if (ids.length > 0) {
      parentNode.push(...findParentNode(ids))
    }
    return parentNode
  }

  const onChange: NonNullable<TableProps['rowSelection']>['onChange'] = (
    selectedRowKeys,
    _selectedRows,
    info: {type: RowSelectMethod},
  ) => {
    if (info.type === 'all') {
      options.onChange(selectedRowKeys as number[])
    }
  }

  const onSelect: NonNullable<TableProps['rowSelection']>['onSelect'] = (
    record,
    selected,
    selectedRows,
  ) => {
    const selectedRowIds = Array.from(new Set(selectedRows.filter((s) => s).map((s) => s.id)))
    const unmerge = unmergeTree([record as ResourceEntity])
    const unmergeIds = unmerge.map((u) => u.id)

    if (selected) {
      const parentIds = [
        ...new Set(
          unmerge.map((u) => u.parentId).filter((id): id is number => id != null && id !== record.id),
        ),
      ]
      options.onChange([
        ...findParentNode(parentIds).map((r) => r.id),
        ...selectedRows.filter((s) => s).map((r) => r.id),
        ...unmerge.filter((d) => !selectedRowIds.includes(d.id)).map((r) => r.id),
      ])
      return
    }

    const parentIds = [
      ...new Set(unmerge.map((u) => u.parentId).filter((id): id is number => id != null)),
    ]
    for (const parent of findParentNode(parentIds)) {
      const full = findFirstTreeNode((r) => r.id === parent.id, options.dataSource())
      if (full?.children && !full.children.some((c) => selectedRowIds.includes(c.id))) {
        selectedRowIds.splice(selectedRowIds.indexOf(parent.id), 1)
        unmergeIds.push(parent.id)
      }
    }

    options.onChange(
      selectedRows.filter((s) => s).filter((s) => !unmergeIds.includes(s.id)).map((r) => r.id),
    )
  }

  return {fixed: true, type: 'checkbox', selectedRowKeys: options.selectedIds(), onSelect, onChange}
}

export const resourcePage = defineCrudPage<ResourceSavePayload, ResourceEntity>({
  service: resourceService,
  rowKey: SYSTEM_CONSTANT.ID_NAME,
  i18nPrefix: 'authServer.resource',
  routes: {
    home: AUTH_SERVER_RESOURCE_ROUTE.HOME,
    add: AUTH_SERVER_RESOURCE_ROUTE.ADD,
    edit: AUTH_SERVER_RESOURCE_ROUTE.EDIT,
    detail: AUTH_SERVER_RESOURCE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.RESOURCE,

  /** 字段字典：labelKey / format / enumId 只写一次 */
  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    authority: {labelKey: 'authServer.authority'},
    applicationName: {labelKey: 'authServer.resource.applicationName'},
    page: {labelKey: 'authServer.resource.page'},
    type: {labelKey: 'common.type', format: 'enum', enumId: SYSTEM_ENUM_TYPE.RESOURCE_TYPE_ENUM},
    category: {labelKey: 'common.category', format: 'enum', enumId: SYSTEM_ENUM_TYPE.RESOURCE_CATEGORY_ENUM},
    sources: {
      labelKey: 'authServer.source',
      format: 'enumList',
      enumId: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM,
    },
    enabled: {labelKey: 'common.enabled', format: 'enum', enumId: SYSTEM_ENUM_TYPE.YES_OR_NO},
    remark: {labelKey: 'common.remark'},
  },

  list: {
    authority: {
      add: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      edit: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
      detail: AUTH_SERVER_RESOURCE_AUTHORITY.GET,
      delete: AUTH_SERVER_RESOURCE_AUTHORITY.DELETE,
    },
    enums: [
      SYSTEM_ENUM_TYPE.RESOURCE_TYPE_ENUM,
      SYSTEM_ENUM_TYPE.RESOURCE_CATEGORY_ENUM,
      SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM,
    ],
    rowSelection: {
      fixed: true,
      type: 'checkbox',
      getCheckboxProps: (record: Record<string, unknown>) => ({
        disabled:
          getEnumValue((record as unknown as ResourceEntity).category) ===
          AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN,
      }),
    },
    // 树表拖拽排序；提交在页面壳里（@tree-drop）
    drag: true,
    // 拖拽时显示的文本，缺省是主键（会显示成一串 id）
    formatDragPreview: (record) => renderIconName(record.name,record) as DragPreviewContent,
    columns: [
      {key: 'name', width: 450, render: renderIconName, search: {component: 'input', expression: 'like'}},
      {key: 'authority', width: 250, search: {component: 'input', expression: 'like'}},
      // 当选择器用的时候（variant: 'picker'）不展示来源
      {
        key: 'sources',
        width: 300,
        visible: ({variant}) => variant !== RESOURCE_VARIANT.PICKER,
        search: {component: 'select', expression: 'jin', props: {mode: 'multiple'}},
      },
      {key: 'applicationName', width: 150, search: {component: 'input', expression: 'like'}},
      {key: 'page', width: 350, search: {component: 'input', expression: 'like'}},
      {
        key: 'type',
        width: 150,
        search: {component: 'select', expression: 'in', props: {mode: 'multiple'}},
      },
      {key: 'category', width: 150, search: {component: 'select', expression: 'eq'}},
    ],
    rowActions: (ctx) => [
      {
        id: 'addChild',
        permission: AUTH_SERVER_RESOURCE_AUTHORITY.SAVE,
        label: () => ctx.t('common.addChild', {name: ''}),
        icon: () => renderIconFont('loncra-list-tree'),
        run: (actionCtx) => {
          if (actionCtx.record) {
            void ctx.router.push({
              name: AUTH_SERVER_RESOURCE_ROUTE.ADD_CHILD,
              query: {parentId: String(actionCtx.record.id)},
            })
          }
        },
      },
      // 选择器形态只留 addChild；整页才有编辑/删除
      ...(ctx.variant === RESOURCE_VARIANT.PICKER ? [] : [{id: 'edit'}, {id: 'delete'}]),
    ],
  },

  form: {
    createEntity: () => ({
      sort: 0,
      enabled: 1,
      authority: '',
      type: '',
      sources: [],
      name: '',
      icon: '',
      parentId: null as unknown as number,
      applicationName: '',
      page: '',
      id: null as unknown as number,
      version: null as unknown as string,
      category: AUTH_SERVER_RESOURCE_CATEGORY.CUSTOMIZE,
      remark: '',
    }),
    fields: [
      {
        key: 'name',
        component: 'input',
        rules: ({entity}) => (isPlugin(entity) ? [] : [{required: true}]),
      },
      {
        key: 'authority',
        component: 'input',
        rules: ({entity}) => (isPlugin(entity) ? [] : [{required: true}]),
        props: ({entity}) => ({disabled: Boolean(entity?.id) && isPlugin(entity)}),
      },
      {
        key: 'sources',
        component: 'select',
        rules: ({entity}) =>
          isPlugin(entity) ? [] : [{required: true, trigger: 'change', type: 'array'}],
        props: ({entity}) => ({mode: 'multiple', disabled: Boolean(entity?.id) && isPlugin(entity)}),
      },
      {
        key: 'type',
        component: 'select',
        props: ({entity}) => ({disabled: Boolean(entity?.id) && isPlugin(entity)}),
      },
      {
        key: 'enabled',
        component: 'select',
        props: ({entity}) => ({disabled: Boolean(entity?.id) && isPlugin(entity)}),
      },
      {key: 'page', component: 'input'},
      {key: 'icon', labelKey:'common.icon', span: 24, component: IconSelect, props: () => ({options: iconOptions.value})},
      {
        key: 'remark',
        component: 'textarea',
        span: 24,
        props: {rows: 4, showCount: true, maxlength: 256},
      },
    ],
    titleText: (title, entity, ctx) => {
      const parent = (ctx.extra.parent as Ref<ResourceEntity | undefined> | undefined)?.value
      if (parent) {
        return `${title} (${parent.name})`
      }
      const value = entity as ResourceEntity
      return value.id ? `${title} (${value.name})` : title
    },
    // addChild 入口：带父资源；顺便懒加载图标清单
    preMounted: async (ctx) => {
      if (iconOptions.value.length === 0) {
        iconOptions.value = await Promise.all(
          ICON_MANIFESTS.map((path) => loadIcon(import.meta.env.VITE_APP_SITE_URL + path)),
        )
      }
      const parentId = ctx.router.currentRoute.value.query.parentId
      if (!parentId) {
        return
      }
      const result = await resourceService.get(parentId as never)
      if (!result.data) {
        return
      }
      const parentRef = ctx.extra.parent as Ref<ResourceEntity | undefined> | undefined
      if (parentRef) {
        parentRef.value = result.data
      }
      const entity = ctx.entity?.value
      if (entity) {
        entity.parentId = result.data.id
      }
    },
  },

  detail: {
    column: {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1},
    titleText: (title, entity) => `${title} (${entity.name})`,
    fields: [
      'id',
      {key: 'name', render: renderIconName},
      'authority',
      'page',
      'sources',
      'type',
      'category',
      'enabled',
      'remark',
    ],
  },
})
