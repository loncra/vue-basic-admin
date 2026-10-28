import {h} from 'vue'
import {Space, type TableProps} from 'antdv-next'
import type {RowSelectMethod} from 'antdv-next/dist/table/interface'
import {renderIconFont} from '@/utils/commonUtils'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {ResourceService} from '@loncra/client/auth'
import {
  type FilterRequest,
  findAllTreeNodes,
  findFirstTreeNode,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  unmergeTree
} from '@loncra/client/commons'
import {AUTH_SERVER_RESOURCE_ROUTE} from '@/constants'
import type {CrudPageCore} from '@loncra/antdv-pro'

export const resourceService = new ResourceService()

export const RESOURCE_VARIANT = {PICKER: 'picker'} as const

export const fetchEnterpriseResources = (request: FilterRequest) =>
  resourceService.findEnterprise(request)

export function renderIconName(value: unknown, record: ResourceEntity) {
  return h(Space, null, () => [
    renderIconFont(record.icon || 'loncra-file', 'icon align'),
    String(value ?? ''),
  ])
}

export function resourceTreeSelection(options: {
  dataSource: () => ResourceEntity[]
  selectedIds: () => number[] | undefined
  onChange: (ids: number[]) => void
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
