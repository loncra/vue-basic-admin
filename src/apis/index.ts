/**
 * @file API 层统一出口
 * @description 聚合各子域服务（auth-server、resource-server）；通用 REST 基类请从具体文件按需导入。
 */
export * from './auth-server/index.ts'
export * from './resource-server/index.ts'
