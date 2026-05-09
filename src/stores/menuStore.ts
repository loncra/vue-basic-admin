import {ref} from 'vue'
import {defineStore} from 'pinia'
import {STORE} from '@/constants/systemConstant.ts'
import type {ResourceEntity, ResourceType} from '@/types'
import {AuthService} from '@/apis'
import {isResultSuccess} from '@/requests'

/**
 * 重置状态常量
 * 菜单存储的初始空状态
 */
const RESET: ResourceEntity[] = []

/**
 * 菜单状态管理 Store
 * 用于管理后台用户的菜单资源数据
 */
export const useMenuPrincipalStore = defineStore(STORE.MENU_ID, () => {
  /** 菜单资源数据状态 */
  const state = ref<ResourceEntity[]>(RESET)

  /**
   * 重置菜单状态
   * 将菜单数据重置为空数组
   *
   * @returns 重置后的空菜单数组
   */
  function $reset(): ResourceEntity[] {
    state.value = [...RESET]
    return state.value
  }

  /**
   * 获取后台用户资源
   * 从服务端获取当前登录用户的菜单资源，并可选择是否合并为树形结构
   *
   * @param types - 资源类型数组，用于过滤特定类型的资源（如 'menu'、'security'）
   * @param mergeTree - 是否将资源合并为树形结构，默认为 true
   * @returns Promise 对象，成功时返回菜单资源数组
   * @throws {Error} 当获取资源失败时抛出错误
   */
  async function getPrincipalResources(
    types: ResourceType[],
    mergeTree: boolean = true,
  ): Promise<ResourceEntity[]> {
    if (state.value.length > 0) {
      return state.value;
    }
    const result = await AuthService.principalResources(types, mergeTree)
    if (!isResultSuccess(result)) {
      return []
    }
    // 更新状态并返回数据
    state.value = result.data
    return state.value
  }

  return {
    state,
    getPrincipalResources,
    $reset,
  }
})
