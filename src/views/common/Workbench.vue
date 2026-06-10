<script setup lang="ts">
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {usePrincipalStore} from '@/stores/principalStore.ts'
import {dateTimeFormat, postTimestampFormat, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {OperationDataTraceAuditEventService} from "@/apis";
import type {AuditEventEntity, RestResult, TotalPage} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

defineOptions({
  name: 'CommonWorkbench'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()
const menuStore = useMenuPrincipalStore()
const messageServerStore = useMessageServerStore()
const operationDataTraceAuditEventService = new OperationDataTraceAuditEventService()
const personalActivityItems = ref<AuditEventEntity[]>([])

const quickAccessBadgeName = ["my_chat_message","my_message"]

async function mounted() {
  const request = {
    number: 1,
    size:1000,
    'filter_[principal_eq]':principalStore.state.name,
    'after': globalProperties.$dayjs().startOf('d')
  }
  const result: RestResult<TotalPage<AuditEventEntity>> = await operationDataTraceAuditEventService.page(request)
  const elements = result.data?.elements
  if (elements && elements.length > 0) {
    personalActivityItems.value = elements
  }

}

onMounted(mounted)

</script>

<template>
  <a-row :gutter="configProviderStore.getToken().sizeMD">
    <a-col span="6">
      <a-flex gap="large" vertical>
        <a-card :classes="{body:'max-h-72 overflow-auto'}" :title="globalProperties.$t('workbench.quickAccess')">
          <template #extra>
            <icon-font class="icon" type="loncra-fan"/>
          </template>
          <template v-if="menuStore.state.quickAccess.length > 0">
            <a-card-grid class="group relative w-1/3 min-h-15 cursor-pointer p-md" @click="globalProperties.$router.push(item.page)" :key="item.page" v-for="item of menuStore.state.quickAccess" >
              <a-flex vertical align="center" gap="small" justify="space-between" class="h-full min-h-12">
                <a-badge v-if="quickAccessBadgeName.includes(String(item.route))" size="small" :count="messageServerStore.getUnreadQuantityByType(String(item.route))">
                  <icon-font class="icon text-2xl" :type="item.icon" />
                </a-badge>
                <icon-font v-else class="icon text-2xl" :type="item.icon" />
                <a-typography-text
                  :ellipsis="{ tooltip: item.name }"
                >
                  {{item.name}}
                </a-typography-text>
              </a-flex>
              <icon-font
                @click.stop="menuStore.removeQuickAccess(item.page)"
                class="icon absolute top-2 right-2 text-xs text-text-secondary opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
                type="loncra-x"
                />
            </a-card-grid>
          </template>
          <a-empty v-else/>
        </a-card>

        <a-card>
          <a-flex gap="small" vertical justify="space-between" align="center">
            <a-avatar :size="configProviderStore.getToken().sizeXXL" :src="principalStore.getAvatarUrl()" >
              {{principalStore.getAvatarPrefix()}}
            </a-avatar>
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
          </a-flex>

          <a-divider plain orientation="left" class="text-text-secondary">
            <a-space>
              <icon-font class="icon" type="loncra-file-text"/>
              {{globalProperties.$t('common.basicInformation')}}
            </a-space>
          </a-divider>

          <a-space direction="vertical" class="w-full">
            <a-flex justify="space-between" align="center">
              <a-space>
                <icon-font class="icon" type="loncra-smartphone"/>
                {{globalProperties.$t('common.phoneNumber')}}
              </a-space>
              <span>{{ principalStore.state?.details?.metadata.phoneNumber }}</span>
            </a-flex>
            <a-flex justify="space-between" align="center">
              <a-space>
                <icon-font class="icon" type="loncra-mail"/>
                {{globalProperties.$t('common.email')}}
              </a-space>
              <span>{{ principalStore.state?.details?.metadata.email }}</span>
            </a-flex>
            <a-flex justify="space-between" align="center">
              <a-space>
                <icon-font class="icon" type="loncra-transgender"/>
                {{globalProperties.$t('common.gender')}}
              </a-space>
              <span>{{ principalStore.state?.details?.metadata?.gender?.name }}</span>
            </a-flex>
          </a-space>
        </a-card>

        <a-card :title="globalProperties.$t('workbench.personalActivity')" :classes="{body:'max-h-125 overflow-auto'}">
          <template #extra>
            <icon-font class="icon" type="loncra-timer"/>
          </template>
          <a-timeline
            v-if="personalActivityItems.length > 0"
          >
            <a-timeline-item
              :key="item.id"
              v-for="item of personalActivityItems"
            >
                <a-flex align="center">
                  <a-tooltip :title="dateTimeFormat(item.timestamp)">
                    <a-tag>
                      {{globalProperties.$dayjs(item.timestamp).fromNow()}}
                    </a-tag>
                  </a-tooltip>
                  <a-typography-text
                    :ellipsis="{ tooltip: item.data?.metadata?.name }"
                    class=" flex-1 cursor-pointer"
                    @click="globalProperties.$router.push({name:'auth_server_audit_event_authentication_detail', query:{id:String(item.id),after:postTimestampFormat(item.timestamp)}})">
                    {{ item.data?.metadata?.name }}
                  </a-typography-text>
                </a-flex>
            </a-timeline-item>
            <a-timeline-item
              :key="item.id"
              v-for="item of personalActivityItems"
            >
                <a-flex align="center">
                  <a-tooltip :title="dateTimeFormat(item.timestamp)">
                    <a-tag>
                      {{globalProperties.$dayjs(item.timestamp).fromNow()}}
                    </a-tag>
                  </a-tooltip>
                  <a-typography-text
                    :ellipsis="{ tooltip: item.data?.metadata?.name }"
                    class=" flex-1 cursor-pointer"
                    @click="globalProperties.$router.push({name:'auth_server_audit_event_authentication_detail', query:{id:String(item.id),after:postTimestampFormat(item.timestamp)}})">
                    {{ item.data?.metadata?.name }}
                  </a-typography-text>
                </a-flex>
            </a-timeline-item>
            <a-timeline-item
              :key="item.id"
              v-for="item of personalActivityItems"
            >
                <a-flex align="center">
                  <a-tooltip :title="dateTimeFormat(item.timestamp)">
                    <a-tag>
                      {{globalProperties.$dayjs(item.timestamp).fromNow()}}
                    </a-tag>
                  </a-tooltip>
                  <a-typography-text
                    :ellipsis="{ tooltip: item.data?.metadata?.name }"
                    class=" flex-1 cursor-pointer"
                    @click="globalProperties.$router.push({name:'auth_server_audit_event_authentication_detail', query:{id:String(item.id),after:postTimestampFormat(item.timestamp)}})">
                    {{ item.data?.metadata?.name }}
                  </a-typography-text>
                </a-flex>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else/>
        </a-card>
      </a-flex>
    </a-col>
    <a-col span="18">
      <a-card>
        <a-calendar/>
      </a-card>
    </a-col>
  </a-row>
</template>
