import {inject, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import i18n from '@/i18n'
import {LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY, SYSTEM_CONSTANT, SYSTEM_ROUTE} from '@/constants'

/** 「至少一个」还是「全部必须有」 */
export interface RequiredQueryOptions {
  /** `true` = 列出的字段**至少有一个**就行（新增表单那种"给谁都行"）；默认全部必须有 */
  anyOf?: boolean
}

/**
 * 校验结果 + **请求字段的值**（`const {ok, id} = useRequiredQuery()`）。
 *
 * 值是 `number`：这些参数在宿主里都是 **id**，声明层 / 服务层要的也是 `number`
 * （URL 里本来是字符串 ⇒ 这个转换以前散在每个页壳的 `as number | undefined` 里）。
 * 空串与非数字一律当"没给"（`undefined`）。
 */
export type RequiredQueryResult<T extends string> = {
  /** 参数齐不齐（快照） */
  ok: boolean
  /** 缺哪些字段（空数组 = 齐了） */
  missing: string[]
} & Record<T, number | undefined>

/**
 * 必备查询参数校验 + 取参 —— **宿主策略**：pro 不认路由（`id` 也是宿主从 `route.query` 取出来传进去的），
 * 所以"参数够不够、值是多少"只能宿主判。
 *
 * 旧代码里这段是**逐页手抄**的（`BasicDetail.vue:80-92` 抄一份，`data-dictionary/Form.vue`、
 * `model-setting/Form.vue` 又各抄一份），行为一样：
 * 缺参数 ⇒ 往 sessionStorage 塞一份「code / field / defaultMessage」表（`BadRequest.vue:36-46` 读它渲染
 * 成表格）⇒ 跳 400 页 + 关掉当前 tab。
 *
 * **用法**（值直接解构出来，不用再自己读 `route.query`、也不用再写 `as number`）：
 * ```ts
 * const {ok, id} = useRequiredQuery()                                        // 详情：必须有 id（默认）
 * const {ok, parentId} = useRequiredQuery(['parentId'])                      // 表单：新增也要带参数
 * const {ok, id, parentId, typeId} =
 *   useRequiredQuery(['id', 'parentId', 'typeId'], {anyOf: true})            // 「给谁都行」：至少一个
 * ```
 * 模板给壳加 `v-if="ok"` —— 参数不齐时**壳根本不挂载**（不会留一个空卡片 / 坏表单给用户，
 * 也不会白跑一次请求），然后 `onMounted` 里跳 400 把缺什么列清楚，方便调试。
 *
 * **`ok` / `missing` / 各个字段值都是快照**（进入时判定并取值一次）—— 这是入口校验，
 * 没有消费方需要它跟随路由变化；写成响应式会把"本页存不存在"绑到**当前 URL** 上
 * （路由切走后再重挂载 / 重新激活时会重算 ⇒ 壳被拆掉、回头再挂回来 ⇒ 白跑一次取数）。
 *
 * @param fields 要校验 / 取值的 query 字段（默认 `['id']`）
 * @param options 见 `RequiredQueryOptions`
 */
export function useRequiredQuery<T extends string = typeof SYSTEM_CONSTANT.ID_NAME>(
  fields: readonly T[] = [SYSTEM_CONSTANT.ID_NAME] as unknown as readonly T[],
  options: RequiredQueryOptions = {},
): RequiredQueryResult<T> {
  const route = useRoute()
  const router = useRouter()
  const closeLayoutTab = inject<(page: string, activatePane: boolean) => void>(
    LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  )

  /**
   * 各字段的值 —— **快照**：顺手把 `LocationQueryValue`（`string | null` / 数组）收敛，
   * 并**按宿主约定转成数字**（这些参数都是 id；声明层要 `number`）。空串 / 非数字 ⇒ 当没给。
   */
  const values: Record<string, number | undefined> = {}
  for (const field of fields) {
    const raw = route.query[field]
    const single = (Array.isArray(raw) ? raw[0] : raw) ?? undefined
    const num = single === undefined || single === '' ? Number.NaN : Number(single)
    values[field] = Number.isNaN(num) ? undefined : num
  }

  /** 缺哪些字段（空数组 = 齐了）。`anyOf` 时"一个都没有"才算缺，并把候选都报出来（好排查） */
  const missing = options.anyOf
    ? Object.keys(values).every((field) => values[field] == null)
      ? [...fields]
      : []
    : fields.filter((field) => values[field] == null)
  const ok = missing.length === 0

  onMounted(() => {
    if (ok) {
      return
    }
    // 缺了什么、错在哪，都摆到 400 页上（不然就是一个什么都不显示的空页面，没法调）
    sessionStorage.setItem(
      import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME,
      JSON.stringify(
        missing.map((field) => ({
          // ⚠️ 这是**错误码**（400 页表格里 `error.code` 那一列），不是路由名 ——
          // 虽然值都是 '400'，但那是两回事：跳转用 `SYSTEM_ROUTE.BAD_REQUEST`，这里给错误码。
          code: SYSTEM_ROUTE.BAD_REQUEST,
          field,
          defaultMessage: i18n.global.t('error.notNull', {field}),
        })),
      ),
    )
    router.push({name: SYSTEM_ROUTE.BAD_REQUEST})
    closeLayoutTab?.(route.fullPath, false)
  })

  return {ok, missing, ...values} as RequiredQueryResult<T>
}
