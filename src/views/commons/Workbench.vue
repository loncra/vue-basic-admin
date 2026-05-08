<script setup lang="ts">
import { useConfigProviderStore } from '@/stores/configProviderStore.ts'
import { usePrincipalStore } from '@/stores/principalStore.ts'

defineOptions({
  name: 'LWorkbench',
})

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
</script>

<template>
  <a-row :gutter="configProviderStore.getToken().sizeMD">
    <a-col span="6">
      <a-flex gap="large" vertical>
        <a-card :title="$t('workbench.quickAccess')">
          <template #extra>
            <icon-font class="icon" type="icon-quick" />
          </template>
          <a-empty />
        </a-card>

        <a-card>
          <a-flex vertical justify="space-between">
            <div class="text-center">
              <a-avatar :size="configProviderStore.getToken().sizeXXL" class="mb-sm"> </a-avatar>
              <a-typography-text class="text-xl block">
                {{ principalStore.getName() }}
              </a-typography-text>
              <a-typography-text
                type="secondary"
                class="!text-lg block"
                v-if="principalStore.getRoleName() !== ''"
              >
                {{ principalStore.getRoleName() }}
              </a-typography-text>
            </div>
          </a-flex>
          <div>
            <a-divider plain orientation="left" class="text-text-secondary">
              <a-space>
                <icon-font class="icon" type="icon-suggest" />
                基础信息
              </a-space>
            </a-divider>
            <a-flex justify="space-between" class="mb-md" align="center">
              <a-space>
                <icon-font class="icon" type="icon-phone" />
                电话号码
              </a-space>
              <span>{{ principalStore.state?.details?.metadata.phoneNumber }}</span>
            </a-flex>
            <a-flex justify="space-between" class="mb-md" align="center">
              <a-space>
                <icon-font class="icon" type="icon-email" />
                电子邮箱
              </a-space>
              <span>{{ principalStore.state?.details?.metadata.email }}</span>
            </a-flex>
            <a-flex justify="space-between" align="center">
              <a-space>
                <icon-font class="icon" type="icon-gender" />
                性别
              </a-space>
              <span>{{ principalStore.state?.details?.metadata?.gender?.name }}</span>
            </a-flex>
          </div>
        </a-card>

        <a-card :title="$t('workbench.personalActivity')">
          <template #extra>
            <icon-font class="icon" type="icon-time" />
          </template>

          <a-empty />
        </a-card>
      </a-flex>
    </a-col>
    <a-col span="18">
      <a-card>
        <a-calendar />
      </a-card>
    </a-col>
  </a-row>
</template>
