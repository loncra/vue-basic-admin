<script setup lang="ts">
import {ref} from 'vue'
import {DataLoadingCard} from '@loncra/antdv-pro'
import DataDictionaryHome from '../data-dictionary/Home.vue'
import DictionaryTypeHome from '../dictionary-type/Home.vue'

defineOptions({
  name: 'ResourceServerDictionaryHome',
})

const typeId = ref<number | string>()

</script>

<template>
  <data-loading-card :classes="{card: {header: 'mb-0!', body: 'p-0!'}}">
    <a-splitter >
      <a-splitter-panel default-size="20%" min="15%" max="25%">
        <dictionary-type-home @select="typeId = $event" />
      </a-splitter-panel>
      <a-splitter-panel>
        <data-dictionary-home :type-id="typeId" />
      </a-splitter-panel>
    </a-splitter>
  </data-loading-card>
</template>
