# vue-basic-admin 开发规范

适用范围：本仓全部业务代码（`src/`）。定位：本仓是宿主应用，只做页面声明、布局壳、基础设施装配与纯业务页；可复用能力一律由 packages 仓各包提供（`@loncra/antdv-pro` 控件、`@loncra/antdv-chat` / `@loncra/antdv-chat-pro` IM 与 AI 套件、`@loncra/client` 领域客户端）。

本文件自包含：vue-basic-admin 与 packages 是两个独立的 git 仓库，跨仓相对链接提交后不可用，因此通用判据在本文件内完整给出，涉及 packages 的内容只以包名指称、不放链接。各包的能力细节看 packages 仓里对应包的 README。

## 1. 宿主边界

- 管理端不实现 packages 已有的能力：CRUD 控件（`@loncra/antdv-pro`）、IM/AI 套件（`@loncra/antdv-chat` / `@loncra/antdv-chat-pro`）、请求与上传执行器、枚举/字典/权限机制、领域 Service（`@loncra/client`）。
- Service 一律从 `@loncra/client/*` 子路径导入（`commons` / `auth` / `resource` / `message` / `ai` / `adapters/axios`，见 client 包的 `package.json`）；`src/apis/` 只放 client 覆盖不了的包装，新增包装必须说明 client 为什么覆盖不了。
- 不把包内控件的样式写进 `src/assets/style.css`（见第 8 节）；不得深路径 import 包内 `_util/`（`_util` 是各包的内部实现、不构成跨包契约），要用其能力须经包出口、或宿主自建等价物。
- 实现包定义的 host 注入契约时（如 IM 的 `ImPageHost`、Agent 的会话宿主回调），宿主只灌能力（取数、格式化、跳转），不把页面业务分支写进注入实现；注入的取数与格式化落在基础设施或模块级纯函数（先例：`src/utils/chatUtils.ts`）。

## 2. 通用编码判据

| 原则 | 为什么 | 收益 |
|---|---|---|
| 变更原因相同才同文件：改 A 必然要改 B 就放进一个文件，否则分开 —— 不看行数、不看"职责"这个名字有多大 | 混在一个文件里会共享作用域与闭包，改一处容易连带改坏别处；反过来把同因的小文件拆开，改一个概念要跳好几处 | 能局部定位、能单测，review 时一眼看出这次改动影响面 |
| 契约与实现分离：`interface` 在 `.ts`、渲染在 `.vue` / `.tsx`、注入用 provide/inject | 调用方只该依赖契约，不该知道底层有几种实现 | 换实现不改调用方，宿主可按需替换 |
| 唯一来源：一个值、一个常量、一条规则、一种样式含义、一段实现只在代码里定义一次 | 副本一定会腐坏，改了这处漏那处 | 改一处就够，不会出现两个版本 |
| 扩展而非复制：已有的函数差一点就改它，不另写一个做同一件事、或接着做它剩下那部分的 | 两个近似实现会各自演化，后来的人不知道该用哪个 | 一个概念只有一处实现，扩展一处两边都受益 |
| 空引用一律不准出现：定义、导出、条目如果只是指向别处、自己不带任何内容，就不要存在 | 读者每多跳一层都是纯损耗；空壳在它指向的东西改名或删除之后还留在原地，没人能发现 | 读到的每个名字、每条引用都自带信息，断链与死壳无法存活 |

样式的"唯一来源"约束的是**决定**，不是**生成出来的 CSS**：同一个设计意图只写一次（参数化），各处各自生成一份规则是正常的；"长得一样"不等于"同一意图"，第 3 次重复才抽。

**审计项（无自动检查覆盖，需逐条判定）**：

1. 跨文件复用的类型收在 `src/types/` 或所属模块；只在一个文件出现的类型不外提。
2. 同一语义的字面量在 ≥2 个文件出现时，收在 `src/constants/`；只在一个文件出现的不要外提。
3. 配置型数据（表格列、表单 schema、菜单、映射表）外提成同目录 `.ts`（views 四件套的 `*.page.ts` 即此形态）。
4. 文件或组件本体超阈值而未拆的，写明"为什么不拆"的理由。
5. 新增的函数与已有函数是否重复或近似重复：同一件事换个名字再来一遍，或"已有一个做了一半、又写一个接着做另一半"。这类应改已有函数（加参数 / 加分支 / 扩大导出面）而不是并存；确实要分开的，只允许契约不同（一个纯函数一个带副作用、对外对内、生命周期不同），并在 review 里写明理由。
6. 常量、枚举、类型是否复用了已有的那一份：已有同内容的常量时，不再造第二个同义体（例如 Yes/No 只用 `YES_OR_NO_TYPE`）。
7. 零行为的转发包装不引入：函数体只有一行"调用另一个函数"的包装，调用方直调即可。合法的包装必须至少占一条：① 组装默认参数或附加行为（埋点、重试、鉴权头）；② 为 ≥2 个消费者收敛稳定契约，且底层是易变的或第三方的；③ 做类型适配 / 收窄。

## 3. 粒度阈值

| 对象 | 上限 | 检查方式 |
|---|---|---|
| 任何文件 | **400 行**（不数空行与纯注释行） | oxlint `max-lines` = 400 |
| 普通函数 | 50 行 | 人工 |
| 圈复杂度 | 10 | oxlint `complexity` = 10 |
| 块嵌套深度 | 4 | oxlint `max-depth` = 4 |
| 组件本体（`.vue` 的 script 逻辑 / `setup`） | **200 行** | 人工 |

- 阈值计逻辑行（空行、纯注释行不计），与 `wc -l` 的数字会有出入。
- 超限不等于必须拆，但必须给出"为什么不拆"的理由（通常是"再拆会把一份状态拆到两个 composable 里"）。
- 页面壳（`Home.vue` / `Form.vue` / `Detail.vue`）的体量预期远低于阈值：超限通常说明业务分支漏进了壳，先按第 4 节"页面壳的写法"自查，再考虑拆模块私有组件。

## 4. views 页面模块

- 标准四件套：`Home.vue` / `Form.vue` / `Detail.vue` 薄壳（模板只挂 pro 控件）+ `xxx.page.ts`（`CrudPageCore`：service、`i18nPrefix`、`routes`、`operationDataTraceTarget`）+ `xxx.home.page.ts`（`defineHomePage`）+ `xxx.form.page.ts`（`defineFormPage`）+ `xxx.detail.page.ts`（`defineDetailPage`），声明 API 见 `@loncra/antdv-pro` 各子包 README。
- 声明文件顶层 `new XxxService()` 是常态（页面模块静态带入声明文件）。
- 变体只认这几种：
  - **弹层型**：`CrudFormModal` 吃 `*.form.page.ts` 声明，弹层状态在 `*.home.page.ts` 导出。
  - **组合薄壳页**：只做布局与数据缝（如 `dictionary/Home.vue`），不碰子页内部状态。
  - **多子页/发送流程型**：子模块目录 + 模块级共享 composable。
- 列显示走声明式 `format`（`'enum'` 配 `enumRef`，来源 `@loncra/client/commons` 的 `SYSTEM_ENUM_TYPE` / `SYSTEM_MODULE_NAME`）；动作权限写在动作声明的 `permission` 字段（常量来自 `@loncra/client/auth` / `client/resource`）；组件级权限经 `App.vue` 注入 `Provider` 的 `hasPermission`（见第 7 节）。
- 搜索过滤依赖 pro 按 key 拼接时，非默认拼法必须显式写 `filter_*`。

**页面壳的写法**：壳是路由容器，只做 pro 不认的宿主事（取参、标题、去向、逃生区块），字段与提交全在声明文件；壳里不写业务分支、不发请求。

- `Home.vue`：模板只挂 `CrudHomePage`，不包多余 `<div>`（仅当页面有表格 + 弹窗这类**多根**内容时才包，布局的 `<transition>`/`<keep-alive>` 要求单根）。
- **import 与模板标签**：`@loncra/*` 组件直接用原名 import、模板用 kebab-case 标签（`<crud-home-page>`），不用 `as L` 别名；唯一例外 `Form as LForm`——原名 `<form>` 撞原生 HTML 标签。与 ref 变量撞名的 tag 用 PascalCase 或改 ref 名解决（先例：`attachment-upload` ↔ `attachmentUpload`）。`@loncra/*` 控件必须显式 import（unplugin-vue-components 只自动导入 antdv-next 的组件）。
- **i18n / 路由取用口径（全 `.vue` 适用）**：script 里在 setup 阶段取一次 `const globalProperties = getCurrentInstance()!.appContext.config.globalProperties`（异步回调里取会拿到 null，回调只用捕获好的 const），用 `globalProperties.$t` / `$router` / `$route`；template 里文案直接写 `$t(...)`；不引 `import router from '@/routers'`、不在 `.vue` 里用 `useRouter` / `useRoute` / `useI18n`（这些只留给 `src/composables` 等 `.ts` 文件）。`$route` 是 getter、每次取当前路由；`$t` 随 locale 切换响应。
- `Form.vue`（add / edit / child 三态复用同一文件）：`useEntityPageTitle` + `useFormSuccessBack`（`redirect` 走 `core.routes?.home`，不手写 `router.back()`）；主键走 `useRequiredQuery(['id'], {required: false})`（缺参不跳 400 = 新增态，值是真 `number` 快照而非 `as number` 断言）。模式判定（child 的父级等）不进壳，声明在 `preMounted` 里读 `router.currentRoute.value.query`。
- `Detail.vue`：`useRequiredQuery()`（缺参摆清字段跳 400，模板 `v-if="ok"` 壳不挂载）+ `useEntityPageTitle` + `usePageExit`；id 由它带出并转成 `number`，不再手写 `as number | undefined`。主键是字符串的页面用 `{numeric: false}`（先例：`audit-event/Detail` 的 `id` / `after`）。
- `defineOptions({name})` 必填，统一 `模块 + 实体 + 角色` 的 PascalCase（如 `AuthServerRoleForm`）—— tab / keep-alive / 路由缓存认这个名字。
- 逃生区块（表单/详情里的宿主自定义 UI）拆不拆，沿用第 2 节"变更原因相同才同文件"判据：与 `preSubmit` / `contextExtra` 强耦合且单页专用 → 留在壳里；Form/Detail 双用或体量大 → 拆模块私有组件（先例：`mcp-package/ClarifyPolicyTable.vue`）。

## 5. 路由

- `routers/**` 禁止静态 import `.vue`，页面组件一律 `component: () => import('@/views/….vue')`，包括框架级常驻页。
- 按服务分目录装配：动态路由经 `registerServiceRoutes(serviceName)` 注册，服务未启动则该目录路由不注册。
- 路由名常量就近导出在路由模块里（如 `AUTH_SERVER_ROLE_ROUTE`），页面声明从这引，不经 `constants/` 转发。
- 路由标题走 `*.i18n.ts`（单独 glob 收集）；`meta` 字段沿用既有约定（`applicationName` / `requiresAuth` / `quickAccess` / `parent` / `dynamicTitle` / `icon`）。

## 6. 状态与请求

- store id 统一收在 `constants/systemConstant.ts` 的 `STORE`；启动顺序由 `bootStore` 的管线闸门管理，业务代码不复制启动状态。管线失败时也必须放行闸门（`markDone`），否则路由守卫会永久挂起；失败后启动骨架保留、展示错误与重试。
- `src/requests/http.ts` 是唯一 axios 实例：请求拦截器统一 `buildAuthHeaders()`；业务成功判定唯一来源是 `@loncra/client/commons` 的实现，拦截器只调用；失败统一 `message.error` + 抛 `BusinessError`；401 统一跳登录。页面不得自建实例、不得再写一套成功判定。
- `VITE_APP_*` 环境变量只在基础设施处读取（`http.ts`、`App.vue` 配置注入），页面组件不直接读。

## 7. 上传与 Provider

- `Provider`（`App.vue` 里从 `@loncra/antdv-chat-pro` 显式 import，旧写作 `LProvider`；包内组件名 `LChatProvider`）内部包 `@antdv-next/x` 的 XProvider 与 `@loncra/antdv-pro` 的 `Provider`（后者聚合 antdv ConfigProvider / ClientProvider / CrudConfigProvider）。宿主在 `App.vue` 注入的能力（HTTP 客户端、accessToken、权限、i18n、上传分片大小等）经这条 Provider 链下灌给所有包内控件。
- 宿主不实现上传执行器：分片大小经 `App.vue` 把 `VITE_APP_UPLOAD_BLOCK_SIZE` 传给 `Provider`，统一执行器在 `@loncra/antdv-pro` 侧。

## 8. 样式与层序

- `src/assets/style.css` 首行的 `@layer` 层序声明是**宿主契约**：`theme, base, antd, antdx, antdv-loncra, antdv-loncra-pro, antdv-loncra-chat, antdv-loncra-chat-pro, components, utilities`；新增控件包时同步这一行。
- 层序语义：声明在后的层赢。各包样式按 `antdv-loncra-*` 的顺序落层，宿主的 `components` / `utilities` 层在所有包样式之后——宿主对 `.ant-*` 库类名的覆盖规则写在宿主层（覆盖包层是层序预期）。
- 布局与过渡类写 `@layer components` 内用 `@apply`。
- 控件样式一律住在各包自己的 `genStyleHooks` 里，不落全局 css；"宿主也要用"的公共样式（如全高容器）写宿主自己的层。

## 9. i18n

- 语言包由 `import.meta.glob('@/i18n/locales/*')` 收集，与 `@loncra/antdv-pro` 自带语言包合并，**宿主在前**（同名 key 宿主优先）。
- 页面文案 key 前缀对齐该模块 `CrudPageCore.i18nPrefix`。

## 10. 命名

- `.vue` 组件文件 PascalCase（`UserExport.vue`），全项目禁止 camelCase 混合（`myComponent.vue`）—— Vue 官方风格指南要求 SFC 文件名 PascalCase 或 kebab-case 二选一且全项目统一，本仓取 PascalCase。
- `.ts` 文件名按角色取口径：页面声明 `xxx(.home|.form|.detail).page.ts`、常量 `xxxConstant.ts`、store `xxxStore.ts`、composable `useXxx.ts`、路由标题 `xxx.i18n.ts`。`routers/` 路由模块、`types/` domain 文件与 `utils/` 现存文件为 camelCase（`consoleUser.ts`、`agentMessageDomain.ts`、`commonUtils.ts`），属豁免存量：其中路由模块文件名参与动态装配的服务匹配，改名须同步核对装配逻辑。
- `.vue` 与 `.ts` 是两种文件角色（组件 / 配置与逻辑），各守各的口径，不要求跨种类统一。
- 组件文件一个组件；全局组件放 `src/components/`，模块私有组件就近放模块目录。

## 11. 注释与文档

- 代码里不写注释；注释承载的知识（坑、约定、默认值陷阱、为什么）一律写进本文件、[UTILITIES.md](./UTILITIES.md)（composables 与 utils 的唯一使用说明）或对应包的 README。

## 12. 自动检查与工程配置

- 脚本：`lint`（oxlint --fix → eslint --fix）、`format`（oxfmt src）、`build`（type-check + build-only 并行）；oxlint correctness = error；不用 oxlint-disable 注释压制报错。
- `vite.config.ts` 契约：`@loncra/*` 经 alias 源码直连 + `optimizeDeps.exclude`；`resolve.dedupe` 必须含 `antdv-next`、`@antdv-next/cssinjs`、`@antdv-next/icons`（样式层序生效的前提）；`depPatchPlugins` 里的上游补丁在上游修复后删除。
- antdv-next 组件经 unplugin-vue-components 自动导入；`@loncra/*` 控件显式 import。

## 参考文献

- Vue 官方风格指南 Priority B（SFC 文件名大小写）：https://vuejs.org/style-guide/rules-strongly-recommended.html
- packages 仓（本仓的兄弟目录）的包级文档：`client` / `antdv-pro` / `antdv-chat-pro` 等包各自的 `README.md`。两仓独立维护，本文档不放置跨仓链接。
