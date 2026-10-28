<script setup lang="ts">
import {CrudHomePage} from '@loncra/antdv-pro'
import {siteHomePage} from './site.home.page'

defineOptions({
  name: 'MessageServerSiteHome',
})
</script>

<template>
  <div>
    <crud-home-page :page="siteHomePage" />
  </div>
</template>
