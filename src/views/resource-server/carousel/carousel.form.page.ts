import {h, ref} from 'vue'
import dayjs, {type Dayjs} from 'dayjs'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {RESOURCE_SERVER_CAROUSEL_TYPE} from '@loncra/client/resource'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineFormPage,
  disableDate,
  disableTime,
} from '@loncra/antdv-pro'
import type {CarouselSavePayload} from '@/types/apis'
import {DATE_TIME_FORMAT} from '@/constants'
import {carouselCore} from './carousel.page'

/**
 * 封面上传组件的 ref：`preSubmit`（保存前把选好的图传上去）要拿它调 `upload()`。
 *
 * 放模块级：`cover` 字段是 `render` 自绘（要在表单栅格里排第一，用不了壳的插槽），
 * 组件实例的 ref 只能由这里 `h()` 时挂上。
 */
const coverUploadRef = ref<{upload: () => Promise<ObjectWriteResult | undefined>}>()

/**
 * 轮播图新增/编辑（`Form.vue`）。核心在 `carousel.page.ts`，这里只写表单形态。
 *
 * **声明与壳的分工**：
 * - `#rowLayout` 里那 5 个字段在声明里（`cover` 是 `:span="24"` ⇒ `col: {span: 24}`，
 *   其余默认 `col` = 一行两个 = 旧 `md:12`）；
 * - **`link` 与 `remark` 留在壳的 `#default` 插槽**：`link` 的校验名是嵌套路径
 *   `['link','value']`（表单字段 key 不支持 `a.b`）且是"协议 + 地址"的组合控件；`remark` 紧跟其后
 *   ⇒ 留在插槽里**顺序才与旧页面完全一致**（声明字段会全部排在插槽之前）；
 * - `type` 不写 options：核心字典有 `enumRef` ⇒ pro 自动拉桶；
 * - `cover` / 两个日期是组合控件（要 ref / 要按 `showtime` 禁用）⇒ `render` 自绘。
 */
export const carouselFormPage = defineFormPage(carouselCore, {
  /**
   * 实体初值（照抄旧页面那坨 `ref<CarouselSavePayload>({...})`）。
   * 两个日期字段旧页面写的是 `null as unknown as number` —— 取数后 `postGetEntity` 会换成 dayjs，
   * 这里按宿主类型（`number | Dayjs`）写 `null as unknown as Dayjs`。
   */
  createEntity: () => ({
    name: '',
    type: RESOURCE_SERVER_CAROUSEL_TYPE.PC,
    link: {
      id: 'http://',
      value: '',
    },
    cover: null as unknown as ObjectWriteResult,
    remark: '',
    version: null as unknown as number,
    id: null as unknown as number,
    expirationTime: null as unknown as Dayjs,
    showtime: null as unknown as Dayjs,
  }),
  fields: [
    {
      key: 'cover',
      col: {span: 24},
      rules: [{required: true, trigger: 'change'}],
      /** 单图上传（拖拽），`preSubmit` 里还要调它的 `upload()` ⇒ ref 挂在模块级 */
      render: (ctx) =>
        h(AttachmentUpload, {
          ref: coverUploadRef,
          maxCount: 1,
          multiple: false,
          mode: ATTACHMENT_UPLOAD_MODE.DRAGGER,
          value: ctx.entity.cover,
          'onUpdate:value': (value: unknown) => {
            ctx.entity.cover = value as ObjectWriteResult
          },
        }),
    },
    {key: 'name', component: 'input', rules: [{required: true, trigger: 'change'}]},
    {key: 'type', component: 'select'},
    {
      key: 'showtime',
      component: 'date',
      props: () => ({
        class: 'w-full',
        showTime: true,
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
      }),
    },
    {
      key: 'expirationTime',
      component: 'date',
      /** 过期时间不能早于展示时间（旧页面的 `disabled-date` / `disabled-time` 读 `showtime`） */
      props: (ctx) => ({
        class: 'w-full',
        showTime: true,
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
        disabledDate: (value: Dayjs) => disableDate(value, ctx.entity.showtime as Dayjs),
        disabledTime: (current: Dayjs | null) =>
          disableTime(current, ctx.entity.showtime as Dayjs),
      }),
    },
  ],
  /**
   * 旧页面 `preMounted` 的后半段：URL 上的 `?type=` 覆盖初值。
   * （枚举那一半已由核心字典的 `enumRef` 接管 ✓；声明里读不到路由 ⇒ 壳从 `contextExtra` 递进来。）
   */
  preMounted: (ctx) => {
    const initialType = ctx.extra.initialType as number | string | undefined
    if (initialType !== undefined && initialType !== '') {
      ctx.entity.value.type = Number(initialType)
    }
  },
  /** 旧页面 `postGetEntity`：两个日期字段转 dayjs（DatePicker 要） */
  postGetEntity: (entity) => {
    if (entity.showtime) {
      entity.showtime = dayjs(entity.showtime as Dayjs)
    }
    if (entity.expirationTime) {
      entity.expirationTime = dayjs(entity.expirationTime as Dayjs)
    }
    return entity
  },
  /** 旧页面 `preSubmit`：先把封面图传上去，再提交表单 */
  preSubmit: async () => {
    await coverUploadRef.value?.upload()
  },
})
