# utilities.md — 宿主工具类参考

`src/composables/` 与 `src/utils/` 的**唯一使用说明**：这两个目录的全部导出都在本文，代码里不写注释。文末另收录两个特例条目（模块特有入口与 CRUD formatter）。

约定：

- 示例均摘自仓库真实调用点；类型签名以源码为准，本文只写使用需要知道的部分。
- 标注"来自包"的条目是 `src/composables/index.ts` 转发的包能力，详见对应包文档。
- 标注"预留"的条目当前无使用方。

## 页面壳三件套

`Form.vue` / `Detail.vue` 薄壳的标准配置（见 README「页面壳的写法」），三个 composable 各管一件宿主事。

### useRequiredQuery

```ts
const {ok, id} = useRequiredQuery()                                   // Detail：必须有 id
const {id} = useRequiredQuery(['id'], {required: false})              // Form：id 可选（没有 = 新增）
const {ok, id, parentId, typeId} =
  useRequiredQuery(['id', 'parentId', 'typeId'], {anyOf: true})       // 至少给一个
const {ok, id, after} = useRequiredQuery(['id', 'after'], {numeric: false}) // 字符串主键
```

进入页面时校验路由 query 必备参数并取值快照。行为要点：

- **缺参处理**：把缺哪些字段写进 sessionStorage（`BadRequest.vue` 读它渲染成表格），跳 400 页并关当前 tab；`required: false` 时跳过这套，只取值。
- **值是快照**：进入页面时判定并取值一次，不是响应式——路由切走后 keep-alive 壳被重新激活时不会重算，拿到的仍是"进这页那一刻"的参数。
- **数字口径**（默认）：值转成 `number`（声明层 / 服务层要的是 number）；空串与非数字当"没给"。`0` 是合法 id。
- **字符串口径** `numeric: false`：保留原样字符串。给"id 不是数字"的页面用（先例：`audit-event/Detail` 的 `id` / `after`，大整数转 Number 会丢精度）。
- 模板配合 `v-if="ok"`：参数不齐时壳不挂载。

### useEntityPageTitle

```ts
useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined))
```

把「路由标题 (后缀)」同步写到布局 pane 名与面包屑末项；后缀返回 `undefined` 时只显示路由标题。内部在 setup 时一次性捕获本页路由身份——防止 keep-alive 缓存的页壳在别的路由激活时把标题写串。语言切换、实体加载完成、页面重新激活时重算。

### usePageExit

```ts
const {onStale} = usePageExit({redirect: xxxCore.routes?.home})
```

详情/表单页的离场策略：`onStale` 在记录被删（stale）时跳 `redirect` 并关当前 tab。`redirect` 支持 `RouteLocationRaw | string | (() => ...)`，字符串一律按路由名包装。Form/Detail 壳把它接在控件的 `@stale` 上。

### useFormSuccessBack

```ts
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: roleCore.routes?.home,
  entity: () => formRef.value?.entity,
})
```

表单保存成功后的去向：**编辑态**直接回列表；**新增态**按用户偏好执行（偏好是"每次询问"时弹「回列表 / 再来一条」确认框，可勾选记住），偏好存于 `configProviderStore`。「再来一条」通过 `formKey` 自增重挂表单壳实现清空。`onStale` 透传 `usePageExit` 的同名能力。Form 壳接 `@success="onSuccess"`、`@stale="onStale"`、`:key="formKey"`。

## 列表与搜索

### defineSearchProps

```ts
{key: 'email', search: defineSearchProps('input', {expression: 'eq'})}
```

按组件类型一次产出整份列表搜索项默认值（placeholder、查询表达式、组件 props）。`kind`：`'input' | 'number' | 'select' | 'date' | 'dateRange'`；`override` 按 `PageSearchConfig` 字段覆盖（如 `expression`）。组件 props 返回函数形态，跟随语言切换。所有 `*.home.page.ts` 的列搜索都用它，不再手写搜索配置。

### exportCollectionToView

```ts
// toolbarActions 的 run 里一行完成：导出 → 提示 → 跳导出视图
await exportCollectionToView({service: consoleUserCore.service, query: ctx.query ?? {}, records: ctx.selectedItems})
```

列表导出的统一入口（commonUtils）：内部依次执行 antdv-pro 的 `exportCollectionData`（**选中了就按 id 集合导选中，没选就按当前查询条件导全部**）→ `message.success(result.message)` → 跳转导出视图页（`RESOURCE_SERVER_USER_EXPORT_ROUTE`）。参数形状与 `exportCollectionData` 一致。

前提：`service` 有 `exportData`（`@loncra/client` 的 `DetailSearchRestfulService` 基类自带，`/export` 端点）。后端权限现状：控制台用户与企业共用 `perms[auth_server_console_user:export]`，个人用户用 `perms[auth_server_personal_user:export]`。

在用的模块：console-user、enterprise、personal-user。

## IM 通知与 socket

### useSocketSubscriptions

```ts
const {on, dispose} = useSocketSubscriptions()
const off = on(EVENT, handler)   // off() 单独取消；dispose() 全部取消
```

socket 业务事件订阅的统一收口：自动收集每个订阅的取消函数，组件卸载时统一清理，替代各组件手写"push 数组 + onUnmounted 逐个 off"。

### useChatNotification

```ts
// views/Home.vue：IM 消息/通话的系统级通知
useChatNotification({chatCallConfig: {closeTimerValue}})
```

订阅 IM 相关 socket 事件：新消息渲染成带头像的通知（点击跳会话）、通话邀请渲染成可接听/挂断的通知，并维护未读数与通话会话生命周期。依赖 `chatUtils` 的头像/预览纯函数与 `socketStore`。

## AI 流

### useAgentStream

```ts
// views/common/AiAgent.vue
const {connect, disconnect, disconnectIfRunning} = useAgentStream(() => currentSession.value)
connect(assistantId, loadHistory?)
```

订阅助手 SSE 流，把增量内容合并进当前会话气泡：思考块、正文、工具调用、token 用量、会话状态与名称更新。`disconnectIfRunning` 在组件卸载时中断所有在跑的流。

### getConversationRuns

```ts
const runs = getConversationRuns(conversation)   // AgentSession 中仍在运行的 AI 气泡
```

从会话数据源筛出运行中的 AI 消息气泡（按角色与流式运行状态过滤）。`useAgentStream` 内部与 `AiAgent.vue` 在用。

## 通用纯函数（commonUtils）

### requireNonNullOrUndefined

```ts
const user = requireNonNullOrUndefined(getUser())   // null/undefined 抛错，否则返回原值
```

断言守卫，收窄类型用。全仓使用最广的工具函数。

### convertFormUrlencoded / postTimestampFormat

```ts
data: convertFormUrlencoded(payload)      // 提交前处理整个 payload
postTimestampFormat(value)                // 单值：按 env 的 POST_TIMESTAMP_FORMAT 格式化
```

后端时间口径与显示口径不同：这两个把 dayjs 对象按 POST 时间格式转字符串，其余值原样透传。发请求带时间字段时经它们处理。

### convertObject

```ts
const treeNodes = convertObject(source, {
  fieldMappings: {id: 'key', name: 'label'},
  childrenField: 'children',
  valueTransformers: {...},
})
```

通用数据结构转换：字段映射 + 保留字段 + 值转换器 + 过滤 + 按 `childrenField` 递归。用于菜单、树选择器等"后端结构 → 组件结构"的组装（model-setting 在用）。配置形状见 `ConvertConfig`。

### yesOrNoToBoolean / booleanToYesOrNo

```ts
yesOrNoToBoolean(record.enabled)     // YesOrNo(0/1) → boolean（后端不认布尔）
booleanToYesOrNo(form.enabled)       // 表单值 → 0/1 数值
```

YesOrNo 枚举与布尔的双向转换，表单提交/回显边界用（ForgotPassword、AuthForm、AccountSetting）。

### validatePassword

```ts
// 表单 validator：两次密码一致性，不一致 reject 出 i18n 文案
{validator: () => validatePassword(form.newPassword, form.confirmPassword), trigger: 'change'}
```

第三个参数可指定不一致提示的 i18n key（默认 `auth.newPassword`，登录注册场景传 `auth.password`）。

### renderIconFont

```ts
icon: () => renderIconFont('loncra-download', 'align')
```

把宿主注册的 IconFont 字体图标渲染成 VNode，给 pro 动作的 `icon` 字段用。`type` 是图标名（`loncra-*`），其余参数控制类名 / 旋转 / 转动。

### isTauri

```ts
if (isTauri()) {...}   // 是否运行在 Tauri 壳里
```

预留：当前无使用方，未来桌面壳场景使用。

### uploadFile（来自包）

`src/composables/index.ts` 转发 `@loncra/antdv-pro` 的统一上传执行器（含分片），分片大小来自 `App.vue` 注入的 `VITE_APP_UPLOAD_BLOCK_SIZE`。一般不直接调用——附件上传走 `AttachmentUpload` 控件。

## 资源加载（resourceUtils）

```ts
await loadCss(id, href)      // 按 id 去重，动态插入 link
await loadJs(id, href)       // 按 id 去重，动态插入 script
const conf = await loadIcon(href)          // fetch iconfont json 配置
addAllDataDictionary(sources)              // 字典选项数组头部插入「全部」项
```

`loadCss`/`loadJs`/`loadIcon` 由 `resourceServerService` 用于加载服务端下发的动态资源；`addAllDataDictionary` 给各 `*.form.page.ts` 组装字典下拉选项用。

## 会话渲染纯函数（chatUtils）

| 函数 | 用途 |
|---|---|
| `createUserAvatarNode(user, size?)` | 单个用户头像 VNode（包的 UserAvatar） |
| `createAvatarNode(cover, defaultLabel, size?, groupClass?)` | 会话封面头像组（AvatarGroup 最多 3 个），无封面回退首字母 |
| `getMessageContent(lastUserMessage?, conversation?)` | 会话最后一条消息的预览文本（群聊带发送者前缀；撤回/文件/图片/通话转文案） |
| `getDraftContent(draft)` | 未发送草稿 → 预览文本 |
| `convertSlotConfigToText(slots)` | Sender 词槽配置 → 纯文本 |

消费方：`useChatNotification` 与 `views/common/my/MyChatMessage.vue`（通知与会话列表的渲染层）。

## CRUD 列 formatter（crudFormatters）

```ts
// App.vue：宿主注册给 CRUD DSL 的 formatter 总表
<LProvider :formatters="crudFormatters" ...>
```

| key | 单元格效果 |
|---|---|
| `iconName` | 图标 + 名称（值支持 `icon://` 协议；`args.size` 控制图标尺寸） |
| `principalName` | 头像 + 显示名（真实姓名/昵称/用户名回退链；`args.self` 时本人带「(我)」标记） |
| `auditStatus` | 审核状态 Badge 点 + 状态名，备注非空套 Tooltip |

列声明里 `format: {name: 'principalName', args: {...}}` 使用。

## 模块特有入口

### navigateAfterMessageSend（`views/message-server/navigateAfterMessageSend.ts`）

```ts
// Send 页发送成功后
navigateAfterMessageSend(router, result.data, MESSAGE_SERVER_SMS_ROUTE.HOME)
```

按发送结果形状分流：单条 → 回列表；批量（带 `batchId`）→ 批次详情。

> 这是 message-server 特有的唯一来源，**刻意放在模块目录**而不进 `src/utils/`——其他服务没有这个流程。模块私有的纯函数/composable 落点遵循 README「目录」节的优先级（模块 > 服务 > 全局）。
