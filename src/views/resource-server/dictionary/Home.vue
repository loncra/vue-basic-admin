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
</script>

<template>
  <l-data-loading-card-plan :classes="{body: 'p-0!'}">
    <a-splitter>
      <a-splitter-panel default-size="20%" min="15%" max="25%">
        <dictionary-type-home @select="typeId = $event" />
      </a-splitter-panel>
      <a-splitter-panel>
        <data-dictionary-home :type-id="typeId" />
      </a-splitter-panel>
    </a-splitter>
  </l-data-loading-card-plan>
</template>
