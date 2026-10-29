# vue-basic-admin

loncra 平台的管理端宿主：业务 CRUD 呈现、租户与个人管理、布局壳与全局基础设施装配。可复用能力（CRUD 控件、IM/AI 套件、领域客户端）一律由 packages 仓（本仓的兄弟目录）下各包提供，本应用只做**页面声明、布局壳、基础设施装配、纯业务页**。

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
| `src/apis/` | `@loncra/client`（各后端服务的领域客户端：Service、枚举/权限/字典常量）覆盖不了的 Service 包装（现状仅两个：验证码弹层、Agent SSE） | 与 client 子路径重复的 Service |
| `src/assets/` | 全局样式 + 静态插图 | 控件样式、页面私有样式 |
| `src/components/` | ≥2 个 views 模块共用的全局组件 | 只服务单个模块的组件 |
| `src/composables/` | 状态 + 副作用（`useXxx.ts`），用法见 [UTILITIES.md](./UTILITIES.md) | JSX、纯函数 |
| `src/constants/` | 同一语义字面量在 ≥2 个文件出现时收敛 | 只在单文件出现的字面量 |
| `src/i18n/` | 文案与语言包合并 | 业务逻辑 |
| `src/requests/` | 唯一 axios 实例与拦截器 | 页面私有请求封装 |
| `src/routers/` | 路由模块与动态装配 | 静态 import 页面组件 |
| `src/stores/` | pinia store（`xxxStore.ts`） | 页面私有状态 |
| `src/types/`、`src/utils/` | 跨模块类型 / 纯函数（用法见 [UTILITIES.md](./UTILITIES.md)） | 组件、副作用 |
| `src/views/<服务>/<模块>/` | 页面四件套 + 模块私有组件（就近放，不建 components 子目录） | 全局组件 |

模块私有组件的落点优先级：模块目录 > 服务目录 > 全局；被第二个模块用到时才上提，不许复制。模块特有的 composable / 纯函数同理允许留在模块目录（先例：`message-server/navigateAfterMessageSend.ts`，仅 message-server 的发送流程在用）。

## 文档

- 开发规范（宿主边界、通用判据、views 页面模块、路由、请求、样式层序、命名等）：[CONTRIBUTING.md](./CONTRIBUTING.md)
- composables 与 utils 的用法说明：[UTILITIES.md](./UTILITIES.md)
- 各包的能力与 API：见 packages 仓内对应包的 `README.md`（`client` / `antdv-pro` / `antdv-chat` / `antdv-chat-pro`）。两仓独立维护，本文档不放置跨仓链接。
