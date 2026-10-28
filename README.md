# vue-basic-admin

loncra 平台的管理端宿主：业务 CRUD 呈现、租户与个人管理、布局壳与全局基础设施装配。可复用能力（CRUD 控件、IM/AI 套件、领域客户端）一律由兄弟目录 [packages](../packages/) 下各包提供，本应用只做**页面声明、布局壳、基础设施装配、纯业务页**。

## 安装与运行

```sh
npm install
npm run dev
npm run build
npm run lint
npm run format
npm run type-check
```

管理端通过 `file:../packages/*` 以源码直连方式引用包，包源码改动即时生效、无构建产物。

## 目录

| 目录 | 放什么 | 不允许放 |
|---|---|---|
| `src/apis/` | [`@loncra/client`](../packages/client/README.md)（各后端服务的领域客户端：Service、枚举/权限/字典常量）覆盖不了的 Service 包装（现状仅两个：验证码弹层、Agent SSE） | 与 client 子路径重复的 Service |
| `src/assets/` | 全局样式 + 静态插图 | 控件样式、页面私有样式 |
| `src/components/` | ≥2 个 views 模块共用的全局组件 | 只服务单个模块的组件 |
| `src/composables/` | 状态 + 副作用（`useXxx.ts`） | JSX、纯函数 |
| `src/constants/` | 同一语义字面量在 ≥2 个文件出现时收敛 | 只在单文件出现的字面量 |
| `src/i18n/` | 文案与语言包合并 | 业务逻辑 |
| `src/requests/` | 唯一 axios 实例与拦截器 | 页面私有请求封装 |
| `src/routers/` | 路由模块与动态装配 | 静态 import 页面组件 |
| `src/stores/` | pinia store（`xxxStore.ts`） | 页面私有状态 |
| `src/types/`、`src/utils/` | 跨模块类型 / 纯函数 | 组件、副作用 |
| `src/views/<服务>/<模块>/` | 页面四件套 + 模块私有组件（就近放，不建 components 子目录） | 全局组件 |

模块私有组件的落点优先级：模块目录 > 服务目录 > 全局；被第二个模块用到时才上提，不许复制。

## 开发规范

### 1. 宿主边界

- 管理端不实现 packages 已有的能力：CRUD 控件（[`@loncra/antdv-pro`](../packages/antdv-pro/README.md)）、IM/AI 套件（[`@loncra/antdv-chat`](../packages/antdv-chat/README.md) / [`@loncra/antdv-chat-pro`](../packages/antdv-chat-pro/README.md)）、请求与上传执行器、枚举/字典/权限机制、领域 Service（[`@loncra/client`](../packages/client/README.md)）。
- Service 一律从 `@loncra/client/*` 子路径导入（子路径入口见 [packages/client 的 package.json](../packages/client/package.json)：`commons` / `auth` / `resource` / `message` / `ai` / `adapters/axios`）；`src/apis/` 只放 client 覆盖不了的包装，新增包装必须说明 client 为什么覆盖不了。
- 不把包内控件的样式写进 `src/assets/style.css`（见第 6 节）；不深路径 import 包内 `_util/`（见 [CONTRIBUTING-PACKAGES.md 第 2 节](../packages/CONTRIBUTING-PACKAGES.md#2-文件角色)）。
- 通用编码判据（变更原因相同才同文件、契约与实现分离、唯一来源、扩展而非复制、粒度阈值）沿用 [CONTRIBUTING-PACKAGES.md](../packages/CONTRIBUTING-PACKAGES.md) 第 1 节与第 4 节，本文件不复制。

### 2. views 页面模块

- 标准四件套：`Home.vue` / `Form.vue` / `Detail.vue` 薄壳（模板只挂 pro 控件）+ `xxx.page.ts`（[`CrudPageCore`](../packages/antdv-pro/src/crud-page/README.md)：service、`i18nPrefix`、`routes`、`operationDataTraceTarget`）+ `xxx.home.page.ts`（[`defineHomePage`](../packages/antdv-pro/src/crud-page/home/README.md)）+ `xxx.form.page.ts`（[`defineFormPage`](../packages/antdv-pro/src/crud-page/form/README.md)）+ `xxx.detail.page.ts`（[`defineDetailPage`](../packages/antdv-pro/src/crud-page/detail/README.md)）。
- 声明文件顶层 `new XxxService()` 是常态（页面模块静态带入声明文件）。
- 变体只认这几种：
  - **弹层型**：[`CrudFormModal`](../packages/antdv-pro/src/crud-page/form-modal/README.md) 吃 `*.form.page.ts` 声明，弹层状态在 `*.home.page.ts` 导出。
  - **组合薄壳页**：只做布局与数据缝（如 `dictionary/Home.vue`），不碰子页内部状态。
  - **多子页/发送流程型**：子模块目录 + 模块级共享 composable（如 `useMessageSendFlow.ts`）。
- 列显示走声明式 `format`（`'enum'` 配 `enumRef`，来源 `@loncra/client/commons` 的 `SYSTEM_ENUM_TYPE` / `SYSTEM_MODULE_NAME`）；动作权限写在动作声明的 `permission` 字段（常量来自 `@loncra/client/auth` / `client/resource`）；组件级权限经 `App.vue` 注入 `Provider` 的 `hasPermission`（`Provider` 见第 5 节）。
- 搜索过滤依赖 pro 按 key 拼接时，非默认拼法必须显式写 `filter_*`。

**页面壳的写法**：壳是路由容器，只做 pro 不认的宿主事（取参、标题、去向、逃生区块），字段与提交全在声明文件；壳里不写业务分支、不发请求。

- `Home.vue`：模板只挂 `CrudHomePage`，不包多余 `<div>`（仅当页面有表格 + 弹窗这类**多根**内容时才包，布局的 `<transition>`/`<keep-alive>` 要求单根）。
- **import 与模板标签**：`@loncra/*` 组件直接用原名 import、模板用 kebab-case 标签（`<crud-home-page>`），不用 `as L` 别名；唯一例外 `Form as LForm`——原名 `<form>` 撞原生 HTML 标签。与 ref 变量撞名的 tag 用 PascalCase 或改 ref 名解决（先例：`attachment-upload` ↔ `attachmentUpload`）。`@loncra/*` 控件必须显式 import（unplugin-vue-components 只自动导入 antdv-next 的组件）。
- **i18n / 路由取用口径（全 `.vue` 适用）**：script 里在 setup 阶段取一次 `const globalProperties = getCurrentInstance()!.appContext.config.globalProperties`（异步回调里取会拿到 null，回调只用捕获好的 const），用 `globalProperties.$t` / `$router` / `$route`；template 里文案直接写 `$t(...)`；不引 `import router from '@/routers'`、不在 `.vue` 里用 `useRouter` / `useRoute` / `useI18n`（这些只留给 `src/composables` 等 `.ts` 文件）。`$route` 是 getter、每次取当前路由；`$t` 随 locale 切换响应。
- `Form.vue`（add / edit / child 三态复用同一文件）：`useEntityPageTitle` + `useFormSuccessBack`（`redirect` 走 `core.routes?.home`，不手写 `router.back()`）；主键走 `useRequiredQuery(['id'], {required: false})`（缺参不跳 400 = 新增态，值是真 `number` 快照而非 `as number` 断言）。模式判定（child 的父级等）不进壳，声明在 `preMounted` 里读 `router.currentRoute.value.query`。
- `Detail.vue`：`useRequiredQuery()`（缺参摆清字段跳 400，模板 `v-if="ok"` 壳不挂载）+ `useEntityPageTitle` + `usePageExit`；id 由它带出并转成 `number`，不再手写 `as number | undefined`。主键是字符串的页面用 `{numeric: false}`（先例：`audit-event/Detail` 的 `id` / `after`）。
- `defineOptions({name})` 必填，统一 `模块 + 实体 + 角色` 的 PascalCase（如 `AuthServerRoleForm`）—— tab / keep-alive / 路由缓存认这个名字。
- 逃生区块（表单/详情里的宿主自定义 UI）拆不拆，沿用第 1 节"变更原因相同才同文件"判据：与 `preSubmit` / `contextExtra` 强耦合且单页专用 → 留在壳里；Form/Detail 双用或体量大 → 拆模块私有组件（先例：`mcp-package/ClarifyPolicyTable.vue`）。

### 3. 路由

- `routers/**` 禁止静态 import `.vue`，页面组件一律 `component: () => import('@/views/….vue')`，包括框架级常驻页。
- 按服务分目录装配：动态路由经 `registerServiceRoutes(serviceName)` 注册，服务未启动则该目录路由不注册。
- 路由名常量就近导出在路由模块里（如 `AUTH_SERVER_ROLE_ROUTE`），页面声明从这引，不经 `constants/` 转发。
- 路由标题走 `*.i18n.ts`（单独 glob 收集）；`meta` 字段沿用既有约定（`applicationName` / `requiresAuth` / `quickAccess` / `parent` / `dynamicTitle` / `icon`）。

### 4. 状态与请求

- store id 统一收在 `constants/systemConstant.ts` 的 `STORE`；启动顺序由 `bootStore` 的管线闸门管理，业务代码不复制启动状态。
- `src/requests/http.ts` 是唯一 axios 实例：请求拦截器统一 `buildAuthHeaders()`；业务成功判定唯一来源是 [`@loncra/client/commons`](../packages/client/src/commons/) 的实现，拦截器只调用；失败统一 `message.error` + 抛 `BusinessError`；401 统一跳登录。页面不得自建实例、不得再写一套成功判定。
- `VITE_APP_*` 环境变量只在基础设施处读取（`http.ts`、`App.vue` 配置注入），页面组件不直接读。

### 5. 上传

- `Provider`（App.vue 里从 `@loncra/antdv-chat-pro` 显式 import，旧写作 `LProvider`）是 [`@loncra/antdv-chat-pro`](../packages/antdv-chat-pro/README.md) 出口的 `Provider`（源码：[src/config-provider/ConfigProvider.tsx](../packages/antdv-chat-pro/src/config-provider/ConfigProvider.tsx)，组件名 `LChatProvider`）：内部包 `@antdv-next/x` 的 XProvider 与 [`@loncra/antdv-pro`](../packages/antdv-pro/README.md) 的 `Provider`（[src/config-provider](../packages/antdv-pro/src/config-provider/README.md)，后者聚合 antdv ConfigProvider / ClientProvider / CrudConfigProvider）。宿主在 `App.vue` 注入的能力（HTTP 客户端、accessToken、权限、i18n、上传分片大小等）经这条 Provider 链下灌给所有包内控件。
- 宿主不实现上传执行器：分片大小经 `App.vue` 把 `VITE_APP_UPLOAD_BLOCK_SIZE` 传给 `Provider`，统一执行器在 `@loncra/antdv-pro` 侧（[src/_util/uploadFile.ts](../packages/antdv-pro/src/_util/uploadFile.ts)）。

### 6. 样式

- `src/assets/style.css` 首行的 `@layer` 层序声明是**宿主契约**：`theme, base, antd, antdx, antdv-loncra, antdv-loncra-pro, antdv-loncra-chat, antdv-loncra-chat-pro, components, utilities`；新增控件包时同步这一行。层序语义见 [CONTRIBUTING.md 第 11 节](../packages/CONTRIBUTING.md#11-样式层与覆盖顺序)。
- 布局与过渡类写 `@layer components` 内用 `@apply`；针对 `.ant-*` 库类名的覆盖规则也落在这里（宿主层强于包层是层序预期）。
- 控件样式一律住在各包自己的 `genStyleHooks` 里，不落全局 css；"宿主也要用"的公共样式（如全高容器）写宿主自己的层。

### 7. i18n

- 语言包由 `import.meta.glob('@/i18n/locales/*')` 收集，与 `@loncra/antdv-pro` 自带语言包合并，**宿主在前**（同名 key 宿主优先）。
- 页面文案 key 前缀对齐该模块 `CrudPageCore.i18nPrefix`。

### 8. 命名

- `.vue` 组件文件 PascalCase（`UserExport.vue`），全项目禁止 camelCase 混合（`myComponent.vue`）—— Vue 官方风格指南要求 SFC 文件名 PascalCase 或 kebab-case 二选一且全项目统一，本仓取 PascalCase。
- `.ts` 文件名按角色取口径：页面声明 `xxx(.home|.form|.detail).page.ts`、常量 `xxxConstant.ts`、store `xxxStore.ts`、composable `useXxx.ts`、路由标题 `xxx.i18n.ts`。`routers/` 路由模块、`types/` domain 文件与 `utils/` 现存文件为 camelCase（`consoleUser.ts`、`agentMessageDomain.ts`、`commonUtils.ts`），属豁免存量：其中路由模块文件名参与动态装配的服务匹配，改名须同步核对装配逻辑。
- `.vue` 与 `.ts` 是两种文件角色（组件 / 配置与逻辑），各守各的口径，不要求跨种类统一。
- 组件文件一个组件；全局组件放 `src/components/`，模块私有组件就近放模块目录。

### 9. 注释与文档

- 代码里不写注释；注释承载的知识（坑、约定、默认值陷阱、为什么）一律写进本文件或对应包/控件的 README。

### 10. 自动检查与工程配置

- 脚本：`lint`（oxlint --fix → eslint --fix）、`format`（oxfmt src）、`build`（type-check + build-only 并行）；oxlint correctness = error；不用 oxlint-disable 注释压制报错。
- `vite.config.ts` 契约：`@loncra/*` 经 alias 源码直连 + `optimizeDeps.exclude`；`resolve.dedupe` 必须含 `antdv-next`、`@antdv-next/cssinjs`、`@antdv-next/icons`（样式层序生效的前提）；`depPatchPlugins` 里的上游补丁在上游修复后删除。
- antdv-next 组件经 unplugin-vue-components 自动导入；`@loncra/*` 控件显式 import。

## 参考文献

- Vue 官方风格指南 Priority B（SFC 文件名大小写）：https://vuejs.org/style-guide/rules-strongly-recommended.html
- packages 控件开发规范：[packages/CONTRIBUTING.md](../packages/CONTRIBUTING.md)
- packages 跨包通用规则：[packages/CONTRIBUTING-PACKAGES.md](../packages/CONTRIBUTING-PACKAGES.md)

文中所有 `../packages/...` 链接按本仓与 packages 的本地目录关系（`front-end/` 下的兄弟目录）解析，与 `package.json` 的 `file:` 依赖同一套相对关系。
