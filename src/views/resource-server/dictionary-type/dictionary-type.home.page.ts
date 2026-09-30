import {computed, h, ref} from 'vue'
import {Space, Tooltip} from 'antdv-next'
import {EditOutlined, FileAddOutlined} from '@antdv-next/icons'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY} from '@/constants'
import {dictionaryTypeCore} from './dictionary-type.page'

/**
 * 字典类型弹层：**新增与修改都打开 `Home.vue` 里的弹层**（弹层壳与声明在那儿），
 * 所以状态从声明导出、页面只负责渲染与提交 —— 与 `skill-package` 的快照弹层同款接缝。
 *
 * ⚠️ 这里**不再持有实体**（旧壳 `v-model:entity` 那套）：实体归声明（`createEntity`），
 * 而且弹层内容是**每次打开重挂载**的 ⇒ 只记"这一次为什么开、给谁开"。
 */
export const dictionaryTypeModal = ref<{
  open: boolean
  /** `add` = 工具栏"新增"（含行内"加子级"）；`edit` = 行内"修改" ⇒ 只影响弹层标题 */
  mode: 'add' | 'edit'
  /** 编辑态记录 id。**只给 id**（新增态为 `undefined`），其余由壳按 id 拉 */
  id?: number
  /** "加子级"时的父级：壳经 `:context-extra` 递给声明（`code` 前缀 + `parentId`） */
  parent?: DictionaryTypeEntity
}>({open: false, mode: 'add'})

/**
 * 弹层标题：**按入口切换** —— 工具栏进来是"添加字典类型"、行内进来是"编辑字典类型"。
 *
 * 图标与 **pro 默认动作那一套一致**（`add` = `FileAddOutlined`、`edit` = `EditOutlined`，
 * 见 `packages/antdv-pro/src/_util/crud/defaultActions.ts`）⇒ 弹层标题与列表上那两颗按钮
 * 是同一种"语言"。本页只覆盖了内置 `add` / `edit` 的 `run`（按 id 合并 ⇒ label / icon 仍走默认），
 * 所以这里用默认的同两个图标就不会出现"按钮一个图标、弹层另一个"。
 */
export const dictionaryTypeModalTitle = computed(() => {
  const editing = dictionaryTypeModal.value.mode === 'edit'
  return h(Space, null, {
    default: () => [
      h(editing ? EditOutlined : FileAddOutlined),
      i18n.global.t(editing ? 'common.edit' : 'common.add', {
        name: ' ' + i18n.global.t('resourceServer.dictionaryType.routePage'),
      }),
    ],
  })
})

/** 新增：`parent` 给了就是"加子级"（`parentId` 与 `code` 前缀由壳递给声明） */
function openAdd(parent?: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {open: true, mode: 'add', id: undefined, parent}
}

/** 修改：只给 `id`，剩下的交给壳按 id 拉 */
function openEdit(record: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {open: true, mode: 'edit', id: record.id, parent: undefined}
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
    toolbarActions: [{id: 'add', run: () => openAdd()}],
    recordActions: [
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
