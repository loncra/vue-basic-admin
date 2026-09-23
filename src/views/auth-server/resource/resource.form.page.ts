import {ref, type Ref} from 'vue'
import {IconSelect} from '@loncra/antdv'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_RESOURCE_CATEGORY} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import router from '@/routers'
import {loadIcon} from '@/utils/resourceUtils'
import type {IconfontJson} from '@/types/composables/common'
import {resourceCore} from './resource.page'
import {getEnumValue} from '@loncra/client/commons'

/** 图标清单（表单的 IconSelect 用）。懒加载一次，函数形态的 props 读它 —— 只有表单用，所以留在形态文件里 */
const iconOptions = ref<IconfontJson[]>([])
const ICON_MANIFESTS = ['/font_loncra_icon/iconfont.json', '/font_xiaojiage/iconfont.json']

/** 插件类资源：名称/权限/来源不必填，编辑时也不允许改这几个字段（只有表单用） */
function isPlugin(entity: unknown): boolean {
  return (
    getEnumValue((entity as ResourceEntity | undefined)?.category) === AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN
  )
}

/** 资源新增/编辑（`Form.vue`）。核心在 `resource.page.ts`，这里只写表单形态。 */
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
    {key: 'icon', labelKey: 'common.icon', span: 24, component: IconSelect, props: () => ({options: iconOptions.value})},
    {
      key: 'remark',
      component: 'textarea',
      span: 24,
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
  // 标题不在这里：`titleText` 没进 pro（"怎么写标题"是宿主的事）⇒ 拼装在 `Form.vue` 的
  // `useEntityPageTitle` 里（父资源名 / 实体名的分支照旧）。
  // addChild 入口：带父资源；顺便懒加载图标清单
  preMounted: async (ctx) => {
    if (iconOptions.value.length === 0) {
      iconOptions.value = await Promise.all(
        ICON_MANIFESTS.map((path) => loadIcon(import.meta.env.VITE_APP_SITE_URL + path)),
      )
    }
    // pro 的上下文不带 router（宿主环境不进声明上下文）⇒ 声明文件自己 import 宿主 router
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
