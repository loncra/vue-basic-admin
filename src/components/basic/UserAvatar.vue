<script setup lang="ts">

import {AttachmentService, AuthServerService} from "@/apis";
import type {PlatformUser, UserMetadata} from "@/types/apis";
import {useSlots} from "vue";

defineOptions({
  name: 'LUserAvatar',
})

const props = withDefaults(defineProps<{
  user:PlatformUser | UserMetadata
  fallback?:string
}>(),{
})

const slots = useSlots()

</script>

<template>
  <a-avatar
    :src="AttachmentService.getAvatarUrlIfNotNull(props.user?.avatar) || props.fallback"
    v-bind="$attrs"
  >
    <slot v-if="slots.text" name="text" />
    <template v-else>
      {{ AuthServerService.getPrincipalNameByUserDetails(props.user).substring(0, 1) }}
    </template>
  </a-avatar>
</template>
