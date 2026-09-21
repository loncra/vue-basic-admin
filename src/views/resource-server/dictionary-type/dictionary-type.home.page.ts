import {computed, h, ref} from 'vue'
import {Tooltip} from 'antdv-next'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY} from '@/constants'
import {dictionaryTypeCore} from './dictionary-type.page'

/**
 * 弹层用的空实体（对齐 `l-modal-form` 的既有约定：`id` 为假值就是"新增"，
 * 有 `id` 时弹层自己按 id 拉详情 ⇒ 改动型时只需给 `id`）。
 */
export function emptyDictionaryTypeEntity(): DictionaryTypeSavePayload {
  return {
    code: '',
    name: '',
    id: null as unknown as number,
    version: null as unknown as number,
  }
}

/**
 * 字典类型弹层：**新增与修改都打开 `Home.vue` 里的弹层**（表单与 `l-modal-form` 的 ref 在那儿），
 * 所以状态从声明导出、页面只负责渲染与提交 —— 与 `skill-package` 的快照弹层同款接缝。
 */
export const dictionaryTypeModal = ref<{
  open: boolean
  /** `add` = 工具栏"新增"（含行内"加子级"）；`edit` = 行内"修改" ⇒ 只影响弹层标题 */
  mode: 'add' | 'edit'
  entity: DictionaryTypeSavePayload
  /** "加子级"时的父级：只用来在 `code` 前面显示前缀 */
  parent?: DictionaryTypeEntity
}>({open: false, mode: 'add', entity: emptyDictionaryTypeEntity()})

/** 弹层标题：**按入口切换** —— 工具栏进来是"添加字典类型"、行内进来是"编辑字典类型" */
export const dictionaryTypeModalTitle = computed(() =>
  i18n.global.t(dictionaryTypeModal.value.mode === 'edit' ? 'common.edit' : 'common.add', {
    name: ' ' + i18n.global.t('resourceServer.dictionaryType.routePage'),
  }),
)

/** 新增：`parent` 给了就是"加子级"（带上 `parentId`，`code` 前面显示父级 code） */
function openAdd(parent?: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {
    open: true,
    mode: 'add',
    parent,
    entity: {...emptyDictionaryTypeEntity(), parentId: parent?.id},
  }
}

/** 修改：只给 `id`，剩下的交给弹层按 id 拉（`l-modal-form` 的既有行为） */
function openEdit(record: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {
    open: true,
    mode: 'edit',
    entity: {...emptyDictionaryTypeEntity(), id: record.id},
  }
}

/** 行内"加子级" */
function addChild(ctx: RecordActionContext<DictionaryTypeEntity>): void {
  if (ctx.record) {
    openAdd(ctx.record)
  }
}

/** 行内"修改" */
function editRecord(ctx: RecordActionContext<DictionaryTypeEntity>): void {
  if (ctx.record) {
    openEdit(ctx.record)
  }
}

/** 名称列：悬浮显示 `code`（旧实现 `#bodyCell` 就是这一样） */
function nameCell(_value: unknown, record: DictionaryTypeEntity) {
  return h(Tooltip, {title: record.code}, {
    default: () => h('span', {class: 'cursor-pointer'}, record.name),
  })
}

/** 字典类型列表（`Home.vue`）。核心在 `dictionary-type.page.ts`，这里只写列表形态。 */
export const dictionaryTypeHomePage = defineHomePage<DictionaryTypeSavePayload, DictionaryTypeEntity>(
  dictionaryTypeCore,
  {
    authority: {
      add: RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY.SAVE,
      edit: RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY.SAVE,
      delete: RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY.DELETE,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [{key: 'name', search: defineSearchProps('input'), render: nameCell}],
    /**
     * 工具栏"新增"打开弹层（根级，无父级）。同 id 覆盖内置 `add` 的 `run`：
     * **这一侧没有路由、也没有 Form 页**（增改都是弹层，见 `Home.vue`）。
     */
    titleActions: [{id: 'add', run: () => openAdd()}],
    rowActions: [
      {
        id: 'addChild',
        permission: RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY.SAVE,
        label: () => i18n.global.t('common.addChild', {name: ''}),
        icon: () => renderIconFont('loncra-list-tree'),
        run: addChild,
      },
      /** 同 id 覆盖内置 `edit`：打开弹层，而不是跳编辑路由 */
      {id: 'edit', run: editRecord},
    ],
  },
)
