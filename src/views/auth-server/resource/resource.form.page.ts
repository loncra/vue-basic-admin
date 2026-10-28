import {ref, type Ref} from 'vue'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_RESOURCE_CATEGORY} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {renderIconFont} from '@/utils'
import {loadIcon} from '@/utils/resourceUtils'
import type {IconfontJson} from '@/types/composables/common'
import {resourceCore} from './resource.page'
import {getEnumValue} from '@loncra/client/commons'

const iconOptions = ref<IconfontJson[]>([])
const ICON_MANIFESTS = ['/font_loncra_icon/iconfont.json', '/font_xiaojiage/iconfont.json']

function isPlugin(entity: unknown): boolean {
  return (
    getEnumValue((entity as ResourceEntity | undefined)?.category) === AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN
  )
}

export const resourceFormPage = defineFormPage<ResourceSavePayload, ResourceEntity>(resourceCore, {
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
    {
      key: 'icon',
      labelKey: 'common.icon',
      col: {span: 24},
      component: 'iconSelect',
      props: () => ({
        options: iconOptions.value,
        iconRender: (type: string) => renderIconFont(type),
      }),
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  preMounted: async (ctx) => {
    if (iconOptions.value.length === 0) {
      iconOptions.value = await Promise.all(
        ICON_MANIFESTS.map((path) => loadIcon(import.meta.env.VITE_APP_SITE_URL + path)),
      )
    }
    const parentId = router.currentRoute.value.query.parentId
    if (!parentId) {
      return
    }
    const result = await resourceCore.service.get(parentId as never)
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
})
