<script setup lang="ts">
import {ref} from 'vue'
import {DataLoadingCardPlan as LDataLoadingCardPlan} from '@loncra/antdv-pro'
import DataDictionaryHome from '../data-dictionary/Home.vue'
import DictionaryTypeHome from '../dictionary-type/Home.vue'

/**
 * 字典页（路由 HOME）薄壳：只做**布局**与**一条数据缝** ——
 * 左半边"字典类型"选中哪个类型，右半边"字典数据"就按它过滤加载。
 *
 * 两侧各自是完整页面（`dictionary-type/Home.vue`、`data-dictionary/Home.vue`，各带 `*.page.ts` 声明），
 * 本页不碰它们的内部状态：左页 `select` 抛出 id ⇒ 本页转手传给右页的 `typeId`。
 */
defineOptions({
  name: 'ResourceServerDictionaryHome',
})

/** 左树选中的类型 id */
const typeId = ref<number | string>()

/**
 * 卡片（`classes` 是唯一通到 plan `Card` 的通道）：
 *
 * - `header: 'mb-0!'` —— **必须**。antdv-next 的卡片头自带 `margin-bottom: -1px`
 *   （`node_modules/antdv-next/dist/card/style/index.js` 的 head 段），它会被卡体里
 *   第一个**有背景**的子块（这里就是内层的白卡）压住那 1px ⇒ 卡片头的下边框看着没了。
 *   去掉这个负边距，下边框回来，卡体照样贴边（不用靠加 padding 去躲）。
 * - `body: 'p-0!'` —— 分割器直接顶到卡片头下面。
 */
const cardClasses = {header: 'mb-0!', body: 'p-0!'}

</script>

<template>
  <l-data-loading-card-plan :classes="cardClasses">
    <a-splitter >
      <a-splitter-panel default-size="20%" min="15%" max="25%">
        <dictionary-type-home @select="typeId = $event" />
      </a-splitter-panel>
      <a-splitter-panel>
        <data-dictionary-home :type-id="typeId" />
      </a-splitter-panel>
    </a-splitter>
  </l-data-loading-card-plan>
</template>
