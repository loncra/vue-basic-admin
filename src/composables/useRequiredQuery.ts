import {computed, inject, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import i18n from '@/i18n'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY, SYSTEM_CONSTANT} from '@/constants'

/** 400 页的路由名（`routers/index.ts:53-55` 注册的那个） */
const BAD_REQUEST_ROUTE_NAME = '400'

/**
 * 必备查询参数校验 —— **宿主策略**：pro 不认路由（`id` 也是宿主从 `route.query` 取出来传进去的），
 * 所以"参数够不够"只能宿主判。
 *
 * 旧代码里这段是**逐页手抄**的（`BasicDetail.vue:80-92` 抄一份，`data-dictionary/Form.vue:81-89`、
 * `model-setting/Form.vue:179-200` 又各抄一份），行为一样：
 * 缺参数 ⇒ 往 sessionStorage 塞一份「code / field / defaultMessage」表（`BadRequest.vue:36-46` 读它渲染
 * 成表格）⇒ 跳 400 页 + 关掉当前 tab。
 *
 * **用法**：`const {ok} = useRequiredQuery()`，模板给壳加 `v-if="ok"` ——
 * 参数不齐时**壳根本不挂载**（不会留一个空卡片 / 坏表单给用户，也不会白跑一次请求），
 * 然后 `onMounted` 里跳 400 把缺什么列清楚，方便调试。
 *
 * ```ts
 * const {ok} = useRequiredQuery()                      // 详情：必须有 id（默认）
 * const {ok} = useRequiredQuery(['parentId'])          // 表单：新增也要带参数
 * const {ok} = useRequiredQuery(() => (id || typeId ? [] : ['id typeId']))  // 「至少一个」那种
 * ```
 *
 * @param required 必须存在的 query 字段（默认 `['id']`）；也可以给函数自己算"缺哪些"
 */
export function useRequiredQuery(
  required: string[] | (() => string[]) = [SYSTEM_CONSTANT.ID_NAME],
) {
  const route = useRoute()
  const router = useRouter()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  /** 缺哪些字段（空数组 = 齐了） */
  const missing = computed(() =>
    typeof required === 'function' ? required() : required.filter((field) => !route.query[field]),
  )
  const ok = computed(() => missing.value.length === 0)

  onMounted(() => {
    if (ok.value) {
      return
    }
    // 缺了什么、错在哪，都摆到 400 页上（不然就是一个什么都不显示的空页面，没法调）
    sessionStorage.setItem(
      import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
      JSON.stringify(
        missing.value.map((field) => ({
          code: '400',
          field,
          defaultMessage: i18n.global.t('error.notNull', {field}),
        })),
      ),
    )
    router.push({name: BAD_REQUEST_ROUTE_NAME})
    closeLayoutTab?.(route.fullPath, false)
  })

  return {ok, missing}
}
