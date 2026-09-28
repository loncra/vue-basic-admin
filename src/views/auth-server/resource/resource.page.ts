import {h} from 'vue'
import {Space, type TableProps} from 'antdv-next'
import type {RowSelectMethod} from 'antdv-next/dist/table/interface'
import {renderIconFont} from '@/utils/commonUtils'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {ResourceService} from '@loncra/client/auth'
import {findAllTreeNodes, findFirstTreeNode, type FilterRequest, unmergeTree} from '@loncra/client/commons'
import {
  AUTH_SERVER_RESOURCE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import type {CrudPageCore} from '@loncra/antdv-pro'
import i18n from '@/i18n'

/** 资源服务实例（企业侧页面要拿它调 `findEnterprise`，见 `fetchEnterpriseResources`） */
export const resourceService = new ResourceService()

/**
 * 宿主形态名。role 表单/详情、console-user 表单把资源表当选择器用，传 `variant: RESOURCE_VARIANT.PICKER`，
 * 宿主 import 这个常量，别写字面量。
 */
export const RESOURCE_VARIANT = {PICKER: 'picker'} as const

/**
 * 「**企业可选资源**」的取数口：企业侧的「独立资源」表（企业角色表单 / 详情、企业成员详情）都只列
 * 企业来源的启用资源，而**企业侧登录用户调不了 `resource/find`**（那个只给运营后台）⇒ 必须走
 * `/resource/find/enterprise`。声明里的 `service` 是运营侧那个，所以这些壳用 pro 的 `:fetch` 换掉取数。
 *
 * ⚠️ **不要再往 `query` 里塞 `filter_[enabled_eq]` / `filter_[sources_jin]`**：`findEnterprise`
 * 的服务端实现自带那两个固定过滤，前端重复传会让接口报错。
 */
export const fetchEnterpriseResources = (request: FilterRequest) =>
  resourceService.findEnterprise(request)

/** 名称单元格：图标 + 名称（**列表与详情共用**，所以放核心） */
export function renderIconName(value: unknown, record: ResourceEntity) {
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
 * + `findParentNode`），移植时被我漏掉了，**别再删**。
 *
 * 跨模块共用（role 表单 / role 详情 / console-user 都用它），所以从核心导出。
 */
export function resourceTreeSelection(options: {
  /** 当前表格数据（要按树找祖先 / 子节点，所以取最新的 dataSource） */
  dataSource: () => ResourceEntity[]
  /** 当前已勾选的主键 */
  selectedIds: () => number[] | undefined
  /** 写回勾选结果 */
  onChange: (ids: number[]) => void
  /** 额外的勾选框条件（如企业成员详情里"不是企业主 / 没有保存权限就禁用"）；给不出就是不限制 */
  getCheckboxProps?: NonNullable<TableProps['rowSelection']>['getCheckboxProps']
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

  return {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys: options.selectedIds(),
    getCheckboxProps: options.getCheckboxProps,
    onSelect,
    onChange,
  }
}

/**
 * 资源页面的**核心**：三种形态共用，只写一次。
 * 形态内容在 `resource.home.page.ts` / `resource.form.page.ts` / `resource.detail.page.ts`。
 */
export const resourceCore: CrudPageCore<ResourceSavePayload, ResourceEntity> = {
  service: resourceService,
  i18nPrefix: 'authServer.resource',
  routes: {
    home: AUTH_SERVER_RESOURCE_ROUTE.HOME,
    add: AUTH_SERVER_RESOURCE_ROUTE.ADD,
    edit: AUTH_SERVER_RESOURCE_ROUTE.EDIT,
    detail: AUTH_SERVER_RESOURCE_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.RESOURCE,

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    id: {labelKey: 'common.id'},
    name: {labelKey: 'common.name'},
    authority: {labelKey: 'authServer.authority'},
    applicationName: {labelKey: 'authServer.resource.applicationName'},
    page: {labelKey: 'authServer.resource.page'},
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.RESOURCE_TYPE_ENUM},
    },
    category: {
      labelKey: 'common.category',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.RESOURCE_CATEGORY_ENUM},
    },
    sources: {
      labelKey: 'authServer.source',
      format: 'enumList',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.RESOURCE_SOURCE_ENUM},
    },
    enabled: {
      labelKey: 'common.enabled',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.YES_OR_NO},
    },
    remark: {labelKey: 'common.remark'},
  },
}
