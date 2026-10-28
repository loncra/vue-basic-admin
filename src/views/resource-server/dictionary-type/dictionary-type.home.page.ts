import {computed, h, ref} from 'vue'
import {Space, Tooltip} from 'antdv-next'
import {EditOutlined, FileAddOutlined} from '@antdv-next/icons'
import {defineHomePage, type RecordActionContext} from '@loncra/antdv-pro'
import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '@loncra/client/resource'
import {RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY} from '@loncra/client/resource'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {dictionaryTypeCore} from './dictionary-type.page'

export const dictionaryTypeModal = ref<{
  open: boolean
  mode: 'add' | 'edit'
  id?: number
  parent?: DictionaryTypeEntity
}>({open: false, mode: 'add'})

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

function openAdd(parent?: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {open: true, mode: 'add', id: undefined, parent}
}

function openEdit(record: DictionaryTypeEntity): void {
  dictionaryTypeModal.value = {open: true, mode: 'edit', id: record.id, parent: undefined}
}

function addChild(ctx: RecordActionContext<DictionaryTypeEntity>): void {
  if (ctx.record) {
    openAdd(ctx.record)
  }
}

function editRecord(ctx: RecordActionContext<DictionaryTypeEntity>): void {
  if (ctx.record) {
    openEdit(ctx.record)
  }
}

function nameCell(_value: unknown, record: DictionaryTypeEntity) {
  return h(Tooltip, {title: record.code}, {
    default: () => h('span', {class: 'cursor-pointer'}, record.name),
  })
}

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
    toolbarActions: [{id: 'add', run: () => openAdd()}],
    recordActions: [
      {
        id: 'addChild',
        permission: RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY.SAVE,
        label: () => i18n.global.t('common.addChild', {name: ''}),
        icon: () => renderIconFont('loncra-list-tree'),
        run: addChild,
      },
      {id: 'edit', run: editRecord},
    ],
  },
)
