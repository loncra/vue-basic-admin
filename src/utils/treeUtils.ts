import type {TreeLike} from '@/types'

/**
 * 树形节点条件判断函数类型
 * 用于判断树节点是否满足特定条件
 *
 * @template T - 节点数据类型
 * @param node - 树节点
 * @returns 节点是否满足条件
 */
type Predicate<T> = (node: T) => boolean

/**
 * 检查节点是否有子节点
 * 通过检查 children 属性是否为 undefined 来判断
 * 使用类型谓词（type predicate）确保 TypeScript 能够正确缩小类型
 *
 * @template T - 节点数据类型
 * @param node - 要检查的树节点
 * @returns 如果有子节点返回 true，否则返回 false
 */
export function hasTreeChildren<T>(
  node: TreeLike<T>,
): node is TreeLike<T> & { children: TreeLike<T>[] } {
  return node.children !== undefined
}

/**
 * 在树形结构中查找满足条件的第一个节点
 * 使用深度优先搜索算法递归查找，找到第一个匹配的节点后立即返回
 *
 * @template T - 节点数据类型
 * @param predicate - 查找条件函数，返回 true 表示节点匹配
 * @param data - 树形数据数组
 * @returns 找到的第一个匹配节点，如果未找到返回 undefined
 *
 * @example
 * ```typescript
 * // 输入数据
 * const treeData = [
 *   { id: 1, name: 'A', children: [
 *     { id: 2, name: 'B', children: [{ id: 5, name: 'E' }] },
 *     { id: 3, name: 'C' }
 *   ]},
 *   { id: 4, name: 'D' }
 * ];
 *
 * // 查找 id 为 5 的节点
 * const node = findFirstTreeNode(node => node.id === 5, treeData);
 *
 * // 输出结果
 * // { id: 5, name: 'E' }
 *
 * // 未找到的情况
 * const notFound = findFirstTreeNode(node => node.id === 99, treeData);
 * // undefined
 * ```
 */
export function findFirstTreeNode<T>(
  predicate: Predicate<T>,
  data: TreeLike<T>[] = [],
): T | undefined {
  // 遍历所有节点
  for (const node of data) {
    // 如果当前节点满足条件，直接返回
    if (predicate(node as T)) {
      return node
    }

    // 如果当前节点有子节点，递归查找子节点
    if (hasTreeChildren(node)) {
      const found = findFirstTreeNode(predicate, node.children)
      // 如果在子节点中找到，立即返回
      if (found) {
        return found
      }
    }
  }

  // 没有找到匹配的节点
  return undefined
}

/**
 * 将树形结构的数据展平为一维数组
 * 递归遍历所有节点及其子节点，将整个树结构转换为扁平的数组
 * 注意：返回的节点中不包含 children 属性
 *
 * @template T - 节点数据类型
 * @param data - 树形数据数组
 * @returns 展平后的数组，包含所有节点（已移除 children 属性）
 *
 * @example
 * ```typescript
 * // 输入数据
 * const tree = [
 *   { id: 1, name: 'A', type: 'menu', children: [
 *     { id: 2, name: 'B', type: 'menu' },
 *     { id: 3, name: 'C', type: 'button', children: [
 *       { id: 4, name: 'D', type: 'menu' }
 *     ]}
 *   ]}
 * ];
 *
 * // 展平树结构
 * const flat = unmergeTree(tree);
 *
 * // 输出结果（已移除 children 属性）
 * // [
 * //   { id: 1, name: 'A', type: 'menu' },
 * //   { id: 2, name: 'B', type: 'menu' },
 * //   { id: 3, name: 'C', type: 'button' },
 * //   { id: 4, name: 'D', type: 'menu' }
 * // ]
 * ```
 */
export function unmergeTree<T>(data: TreeLike<T>[] = []): T[] {
  const result: T[] = []
  for (const d of data) {
    // 添加当前节点（不包含 children 属性）
    const {children, ...nodeWithoutChildren} = d
    result.push(nodeWithoutChildren as T)
    // 如果有子节点，递归处理子节点
    if (hasTreeChildren(d)) {
      result.push(...unmergeTree(d.children))
    }
  }
  return result
}

/**
 * 查找树中所有满足条件的节点
 * 递归遍历整个树，收集所有匹配的节点（不包含 children 属性）
 * 返回扁平化的节点数组
 *
 * @template T - 节点数据类型
 * @param predicate - 查找条件函数，返回 true 表示节点匹配
 * @param data - 树形数据数组
 * @returns 所有匹配的节点数组（已移除 children 属性）
 *
 * @example
 * ```typescript
 * // 输入数据
 * const treeData = [
 *   { id: 1, name: 'A', type: 'MENU', children: [
 *     { id: 2, name: 'B', type: 'MENU' },
 *     { id: 3, name: 'C', type: 'BUTTON', children: [
 *       { id: 4, name: 'D', type: 'MENU' }
 *     ]}
 *   ]},
 *   { id: 5, name: 'E', type: 'BUTTON' }
 * ];
 *
 * // 查找所有 type 为 'MENU' 的节点
 * const nodes = findAllTreeNodes(node => node.type === 'MENU', treeData);
 *
 * // 输出结果（已移除 children 属性）
 * // [
 * //   { id: 1, name: 'A', type: 'MENU' },
 * //   { id: 2, name: 'B', type: 'MENU' },
 * //   { id: 4, name: 'D', type: 'MENU' }
 * // ]
 *
 * // 未找到匹配节点的情况
 * const empty = findAllTreeNodes(node => node.type === 'API', treeData);
 * // []
 * ```
 */
export function findAllTreeNodes<T>(predicate: Predicate<T>, data: TreeLike<T>[] = []): T[] {
  const result: T[] = []

  for (const node of data) {
    // 如果当前节点满足条件，添加到结果中（移除 children 属性）
    if (predicate(node)) {
      // children 变量本身不会被使用，它的作用只是"告诉"解构赋值："请把这个属性分离出去"
      // nodeWithoutChildren 将包含除了 children 之外的所有属性（id、name、type 等）
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {children, ...nodeWithoutChildren} = node
      // 将不包含 children 的节点添加到结果中（扁平化结果不需要 children 属性）
      result.push(nodeWithoutChildren as T)
    }

    // 递归处理子节点
    if (hasTreeChildren(node)) {
      result.push(...findAllTreeNodes(predicate, node.children))
    }
  }

  return result
}

/**
 * 深度过滤树节点
 * 递归过滤树结构，保留满足条件的节点及其满足条件的子节点
 * 如果一个节点的子节点被过滤后有剩余，即使该节点本身不满足条件也会被保留（保留父节点结构）
 *
 * @template T - 节点数据类型
 * @param predicate - 过滤条件函数，返回 true 表示节点应该被保留
 * @param data - 树形数据数组
 * @returns 过滤后的树形数据数组，保持树形结构
 *
 * @example
 * ```typescript
 * // 输入数据
 * const treeData = [
 *   { id: 1, name: 'A', status: 'inactive', children: [
 *     { id: 2, name: 'B', status: 'active', children: [
 *       { id: 3, name: 'C', status: 'active' }
 *     ]},
 *     { id: 4, name: 'D', status: 'inactive' }
 *   ]},
 *   { id: 5, name: 'E', status: 'active' },
 *   { id: 6, name: 'F', status: 'inactive', children: [
 *     { id: 7, name: 'G', status: 'inactive' }
 *   ]}
 * ];
 *
 * // 过滤 status 为 'active' 的节点
 * const filtered = filterTreeDeep(node => node.status === 'active', treeData);
 *
 * // 输出结果（保持树形结构）
 * // [
 * //   { id: 1, name: 'A', status: 'inactive', children: [
 * //     { id: 2, name: 'B', status: 'active', children: [
 * //       { id: 3, name: 'C', status: 'active' }
 * //     ]}
 * //   ]},
 * //   { id: 5, name: 'E', status: 'active' }
 * // ]
 * // 注意：id=1 的节点本身 status='inactive'，但因为包含满足条件的子节点（id=2），所以被保留
 * // id=6 的节点及其子节点都不满足条件，被完全移除
 * ```
 */
export function filterTreeDeep<T>(predicate: Predicate<T>, data: TreeLike<T>[]): T[] {
  /**
   * 处理单个节点的内部递归函数
   * 先处理子节点，再决定当前节点是否保留
   */
  function processNode(node: TreeLike<T>): T | null {
    // 如果当前节点有子节点，先递归过滤子节点
    if (hasTreeChildren(node)) {
      const children: TreeLike<T>[] = node.children!
      // 递归处理所有子节点并过滤掉 null 值
      const filteredChildren = children.map(processNode).filter((child) => child !== null)

      // 如果有过滤后的子节点，保留当前节点并包含过滤后的子节点
      if (filteredChildren.length > 0) {
        return {...node, children: filteredChildren}
      }
    }

    // 如果当前节点本身满足过滤条件，返回节点（不包含子节点）
    if (predicate(node)) {
      return {...node}
    }

    // 如果当前节点及其子节点都不满足条件，返回 null 表示丢弃
    return null
  }

  // 对数据中的每个节点调用 processNode 函数，并过滤掉 null 值
  return data
    .filter((node) => node)
    .map(processNode)
    .filter((node) => node !== null)
}
