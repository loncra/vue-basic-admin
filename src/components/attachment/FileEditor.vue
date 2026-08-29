<script setup lang="ts">

import {useFileEditor} from '@/composables'
import type {FileEditorProps} from "@/types/composables/attachmentUpload.ts";
import {h} from "vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'LFileEditor',
})

const props = withDefaults(
  defineProps<FileEditorProps>(),
  {
    readonly: false,
  },
)

const configProviderStore = useConfigProviderStore()

const {
  resolveIcon,
  createMenu,
  onRefresh,
  getDisplayName,
  confirmEdit,
  cancelEdit,
  onMenuClick,
  fileUploadTrigger,
  dirUploadTrigger,
  onRootUpload,
  onUploadChange,
  onDownloadFile,
  onCopyFile,
  state
} = useFileEditor(props)

</script>

<template>
  <div>
    <a-upload
      :key="`file-${state.upload.session}`"
      :show-upload-list="false"
      :before-upload="() => false"
      multiple
      class="hidden"
      @change="onUploadChange"
    >
      <span ref="fileUploadTrigger" />
    </a-upload>
    <a-upload
      :key="`dir-${state.upload.session}`"
      :show-upload-list="false"
      :before-upload="() => false"
      multiple
      directory
      class="hidden"
      @change="onUploadChange"
    >
      <span ref="dirUploadTrigger" />
    </a-upload>
    <a-splitter class="h-120 rounded-lg max-h-180 border border-border-secondary">
      <a-splitter-panel class="min-h-0 h-full overflow-hidden" default-size="20%" min="10%" max="30%">
        <a-flex vertical class="h-full min-h-0">
          <a-flex
            gap="small"
            justify="space-between"
            align="center"
            class="w-full shrink-0 p-xs border-b border-border-secondary"
          >
            <a-flex flex="1" gap="small" align="center">
              <icon-font class="icon" type="loncra-sparkles" />
              <a-typography-text ellipsis>
                <template v-if="props.name">{{props.name}}</template>
                <template v-else>{{$t('common.unname')}}</template>
              </a-typography-text>
            </a-flex>
            <a-space-compact size="small">
              <a-tooltip :title="$t('common.refresh')">
                <a-button @click="onRefresh">
                  <template #icon>
                    <icon-font type="loncra-refresh-cw"/>
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('attachment.upload.file')">
                <a-button @click="onRootUpload(false)">
                  <template #icon>
                    <icon-font type="loncra-upload"/>
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('attachment.upload.directory')">
                <a-button @click="onRootUpload(true)">
                  <template #icon>
                    <icon-font type="loncra-hard-drive-upload"/>
                  </template>
                </a-button>
              </a-tooltip>
            </a-space-compact>
          </a-flex>

          <div class="min-h-0 flex-1 overflow-y-auto">
            <a-spin class="size-full-spin" :spinning="state.loading">
              <a-menu
                class="border-none folder-edit"
                mode="inline"
                :items="state.dataSource"
                :inline-indent="configProviderStore.getToken().sizeXS"
                :expand-icon="h('span')"
                :open-keys="state.openKeys"
                :selected-keys="[state?.selectedItem?.id]"
              >
                <template #iconRender="item">
                  <icon-font v-if="!item.loading" :type="resolveIcon(item)" />
                  <icon-font v-else class="icon align" type="loncra-loader-pinwheel" spin/>
                </template>
                <template #labelRender="item">
                  <a-space-compact
                    v-if="state?.currentEditItem?.id === item.id && state?.currentEditItem?.editing"
                    size="small"
                    block
                    @click.stop
                    @mousedown.stop
                  >
                    <a-input
                      v-model:value="state.currentEditItem.editName"
                      @pressEnter="confirmEdit(state.currentEditItem)"
                    />
                    <a-button
                      type="primary"
                      @click="confirmEdit(state.currentEditItem)"
                    >
                      <template #icon>
                        <icon-font type="loncra-check"/>
                      </template>
                    </a-button>
                    <a-button
                      type="primary"
                      danger
                      @click="cancelEdit(state.currentEditItem)"
                    >
                      <template #icon>
                        <icon-font type="loncra-x"/>
                      </template>
                    </a-button>
                  </a-space-compact>
                  <a-flex
                    v-else
                    class="group min-w-0 w-full"
                    justify="space-between"
                    align="center"
                    @click="onMenuClick(item)"
                  >
                    <a-typography-text
                      class="min-w-0 flex-1"
                      :ellipsis="{ tooltip: {title:item.name, mouseEnterDelay: 1}}"
                    >
                      {{getDisplayName(item)}}
                    </a-typography-text>
                    <span class="relative inline-flex shrink-0 items-center justify-end" v-if="!item.readonly">
                  <a-dropdown
                    :menu="createMenu(item)"
                  >
                    <a-button
                      type="text"
                      size="small"
                      class="absolute opacity-0 transition-opacity duration-300 group-hover:static group-hover:opacity-100"
                      @click.stop
                      @mousedown.stop
                    >
                      <template #icon>
                        <icon-font type="loncra-ellipsis"/>
                      </template>
                    </a-button>
                  </a-dropdown>
                </span>
                  </a-flex>
                </template>
              </a-menu>
            </a-spin>
          </div>
        </a-flex>
      </a-splitter-panel>
      <a-splitter-panel class="min-h-0 size-full">
        <a-flex
          v-if="state.selectedItem"
          vertical
          class="min-h-0 h-full overflow-hidden"
        >
          <a-flex
            justify="space-between"
            align="center"
            class="shrink-0 w-full p-xs border-b border-border-secondary"
          >
            <a-flex flex="1" gap="small" align="center">
              <icon-font :type="resolveIcon(state.selectedItem)" />
              <a-typography-text ellipsis>{{ getDisplayName(state.selectedItem) }}</a-typography-text>
            </a-flex>
            <a-space-compact size="small">
              <a-tooltip :title="$t('common.download.text')">
                <a-button @click="onDownloadFile(state.selectedItem)">
                  <template #icon>
                    <icon-font type="loncra-download"/>
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('common.copy')">
                <a-button @click="onCopyFile(state.selectedItem)">
                  <template #icon>
                    <icon-font type="loncra-copy"/>
                  </template>
                </a-button>
              </a-tooltip>
            </a-space-compact>
          </a-flex>
          <a-flex flex="1" class="size-full p-xs" >
          </a-flex>
        </a-flex>
        <a-flex v-else class="size-full" align="center" justify="center">
          <a-empty />
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>

</template>
