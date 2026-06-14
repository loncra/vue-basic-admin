<script setup lang="ts">

import {AttachmentService, AuthServerService} from "@/apis";
import type {PlatformUser} from "@/types/apis";
import {useSlots} from "vue";

defineOptions({
  name: 'LUserAvatar',
})

const props = withDefaults(defineProps<{
  user:PlatformUser
  size?:string
  fallback?:string
}>(),{
})

const slots = useSlots()

</script>

<template>
  <a-avatar
    v-if="props.user.avatar"
    :src="AttachmentService.getAvatarUrlIfNotNull(props.user.avatar) || props.fallback"
    :size="props.size"
  >
    <slot v-if="slots.text" name="text" />
    <template v-else>
      {{AuthServerService.getPrincipalNameByPlatformUser(props.user).substring(0, 1)}}
    </template>
  </a-avatar>
</template>
