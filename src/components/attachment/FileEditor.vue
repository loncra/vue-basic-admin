<script setup lang="ts">

import {useFileEditor} from '@/composables'
import type {FileEditorProps} from "@/types/composables/attachmentUpload.ts";
import {h} from "vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LFilePaneHost from "@/components/attachment/file-editor/FilePaneHost.vue";

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
  activateTab,
  fileUploadTrigger,
  dirUploadTrigger,
  onRootUpload,
  tabItems,
  tabMeta,
  onPaneDirtyChange,
  paneHostRef,
  onCloseTab,
  saveActive,
  activeCanSave,
  onUploadChange,
  onSelectOpenFile,
  onDownloadFile,
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
                :selected-keys="state.selectedItem ? [state.selectedItem.id] : []"
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
          v-if="state.tabs.length"
          vertical
          class="min-h-0 h-full overflow-hidden"
        >
          <a-tabs
            hide-add
            :destroy-on-hidden="false"
            :active-key="state.selectedItem?.id"
            :items="tabItems"
            :classes="{
              root: 'min-h-0 h-full',
              body: 'min-h-0 h-full overflow-hidden',
              content: 'min-h-0 h-full',
              item:'p-xs m-0',
              header:'pr-xs mb-0'
            }"
            @change="activateTab"
          >
            <template #labelRender="{ item }">
              <a-flex
                align="center"
                gap="small"
                class="group relative overflow-hidden"
              >
                <a-badge :dot="tabMeta[item.key]?.dirty" :offset="[0, 0]">
                  <icon-font class="shrink-0 m-0!" :type="item.iconType" />
                </a-badge>
                <a-typography-text
                  class="min-w-0 flex-1"
                  :ellipsis="{ tooltip: { title: item.label, mouseEnterDelay: 1 } }"
                >
                  {{ item.label }}
                </a-typography-text>
                <a-button
                  type="text"
                  size="small"
                  class="absolute right-0 top-1/2 z-1 -translate-y-1/2 bg-container opacity-0 group-hover:opacity-80 text-text-secondary"
                  @click.stop="onCloseTab(item.key)"
                  @mousedown.stop
                >
                  <template #icon>
                    <icon-font type="loncra-x"/>
                  </template>
                </a-button>
              </a-flex>
            </template>
            <template #contentRender="{ item }">
              <l-file-pane-host
                v-if="item.file"
                :key="item.key"
                class="size-full min-h-0"
                :ref="paneHostRef(item.key)"
                :item="item.file"
                :bucket="props.bucket"
                :readonly="props.readonly"
                :root-path="props.path"
                @dirty-change="(dirty: boolean) => onPaneDirtyChange(item.key, dirty)"
              />
            </template>
            <template #rightExtra>
              <a-space-compact v-if="state.selectedItem" size="small">
                <a-tooltip v-if="activeCanSave" :title="$t('common.save')">
                  <a-button @click="saveActive">
                    <template #icon>
                      <icon-font type="loncra-save"/>
                    </template>
                  </a-button>
                </a-tooltip>
                <a-tooltip :title="$t('common.locate')">
                  <a-button @click="onSelectOpenFile(state.selectedItem)">
                    <template #icon>
                      <icon-font type="loncra-locate-fixed"/>
                    </template>
                  </a-button>
                </a-tooltip>
                <a-tooltip :title="$t('common.download.text')">
                  <a-button @click="onDownloadFile(state.selectedItem)">
                    <template #icon>
                      <icon-font type="loncra-download"/>
                    </template>
                  </a-button>
                </a-tooltip>
              </a-space-compact>
            </template>
          </a-tabs>
        </a-flex>
        <a-flex v-else class="size-full" align="center" justify="center">
          <a-empty />
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>

</template>
