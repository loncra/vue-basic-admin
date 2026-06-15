<script setup lang="ts">

import notFound from "@/assets/ImageNotFound.svg";

defineOptions({
  name: 'LBasicImage',
})

const props = withDefaults(defineProps<{
  preview?:boolean
}>(),{
  preview: true,
})

</script>

<template>
  <div class="size-full overflow-hidden">
    <a-image
      v-bind="$attrs"
      :preview="props.preview"
      :classes="{
        root: 'block size-full',
        image: 'size-full object-cover',
      }"
      :styles="{
        image: { height: '100%', objectFit: 'cover' },
      }"
      class="block size-full [&_.ant-image-img]:h-full [&_.ant-image-img]:w-full [&_.ant-image-img]:object-cover"
      :fallback="notFound"
    >
      <template #cover v-if="props.preview && $slots.cover">
        <slot name="cover" />
      </template>
    </a-image>
  </div>
</template>
