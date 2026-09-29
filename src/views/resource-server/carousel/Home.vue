<script setup lang="ts">

import {
  ActionButton as LActionButton,
  CrudCardGridPage as LCrudCardGridPage,
  DataLoadingCardPlan as LDataLoadingCardPlan,
  isObjectWriteResult,
  useDateFormat,
} from '@loncra/antdv-pro';
import {computed, ref} from 'vue'
import type {CarouselEntity} from "@/types/apis";
import type {NameValueEnumMetadata, PageRequest, RestResult} from "@loncra/client/commons";
import type {EnumBucketsResponseBody} from "@loncra/client/resource";
import {AttachmentService} from "@loncra/client/resource";
import {getEnumName, getEnumValue} from "@loncra/client/commons";
import {ResourceServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore";
import {BasicImage as LBasicImage} from '@loncra/antdv'
import {
  DATA_STATUS,
  RESOURCE_SERVER_CAROUSEL_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@/constants';
import {CAROUSEL_TYPE_FILTER, carouselService} from './carousel.page'
import {carouselHomePage, carouselPreviewReloader} from './carousel.home.page'

/**
 * 每个 tab 的模型：**只有页面结构要用的东西**。
 *
 * 旧实现还在这里放 `selectedItems` / `isLoading` —— 那是网格自己的状态（走
 * `v-model:selected-items` / 内部 `loading`），页面不该再持一份。
 */
interface CarouselTab {
  key: string
  label: string
  /** 该 tab 的查询条件（`v-model:query`）：与声明里的"新增"动作同源（动作从它里面取类型） */
  query: PageRequest
  /** 预览轮播的数据：该类型"已发布"的那一批（`number: -1`，不分页） */
  preview: CarouselEntity[]
  previewLoading: boolean
}

defineOptions({
  name: 'ResourceServerCarouselHome',
})

const {dateTimeFormat} = useDateFormat()

const configProviderStore = useConfigProviderStore()
const principalStore = usePrincipalStore()

const tabs = ref<CarouselTab[]>([])
const tabActiveKey = ref<string>()

/**
 * 拖拽开关：按权限。**这是页面的策略，不是声明能表达的** ——
 * `drag` 的函数形态是"幽灵内容"（不是布尔），pro 也没给拖拽接权限
 * ⇒ 壳用 `$attrs` 传下去（门面把 attrs 排在最后 ⇒ 就是`接管`）。
 */
const dragEnabled = computed(() =>
  principalStore.hasPermission(RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE),
)

function getCoverImageSrc(cover: CarouselEntity['cover']) {
  if (!isObjectWriteResult(cover)) {
    return ''
  }
  return AttachmentService.query(cover.bucketName, cover.objectName)
}

const statusSetting = {
  [DATA_STATUS.NEW]: {
    color: "blue"
  },
  [DATA_STATUS.REVOKE]: {
    color: "yellow"
  },
  [DATA_STATUS.RELEASE]: {
    color: "green"
  }
} as const

/** 预览：把"该类型已发布"的全部拉回来 */
async function loadPreview(tab: CarouselTab): Promise<void> {
  tab.previewLoading = true
  try {
    const result: RestResult<{elements: CarouselEntity[]}> = await carouselService.page({
      number: -1,
      [CAROUSEL_TYPE_FILTER]: tab.key,
      'filter_[status_eq]': DATA_STATUS.RELEASE,
    })
    tab.preview = result.data?.elements ?? []
  } finally {
    tab.previewLoading = false
  }
}

/** 重载**当前 tab** 的预览：声明里的动作 / 落库口干完活要通过 `carouselPreviewReloader` 调它 */
async function reloadActivePreview(): Promise<void> {
  const tab = tabs.value.find((item) => item.key === tabActiveKey.value)
  if (tab) {
    await loadPreview(tab)
  }
}

/**
 * 首屏：拉类型枚举 → 建 tab（每个 tab 一个查询条件）→ 载入第一个 tab 的预览。
 *
 * ⚠️ 这份枚举是**页面结构**（tab 分组）用的，不是"网格的来源"：tab 必须先于网格存在，
 * 而网格在 tab 里面 ⇒ 用不了"网格加载回来的桶"那条接缝（卡片网格也不上报桶），只能由壳拉一次。
 * `#item` 里显示的枚举（状态名）用的是值自带的元数据（`getEnumName`），不需要桶。
 */
async function load(): Promise<void> {
  const enums: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [{id: SYSTEM_ENUM_TYPE.CAROUSEL_TYPE_ENUM}],
  })
  const options = enums.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.CAROUSEL_TYPE_ENUM] as NameValueEnumMetadata<number>[] | undefined
  tabs.value = (options ?? []).map((item) => ({
    key: String(item.value),
    label: item.name,
    query: {
      number: 1,
      size: 10,
      [CAROUSEL_TYPE_FILTER]: String(item.value),
    },
    preview: [],
    previewLoading: false,
  }))
  tabActiveKey.value = tabs.value.at(0)?.key
  await reloadActivePreview()
  // 声明里的动作要靠它刷预览（见 `carousel.home.page.ts` 的说明）
  carouselPreviewReloader.value = reloadActivePreview
}

/** 切回页面：刷当前 tab 的预览（**网格自己刷**：`refreshOnActivate` 默认开） */
async function activated(): Promise<void> {
  await reloadActivePreview()
}
</script>

<template>
  <div>
    <!--
      生命周期交给壳：`onMounted` / `onActivated` 是 `DataLoadingCardPlan` 的两个口
      （它负责编排 + 统一 `loading`）⇒ 页面不再自己写 `onMounted` / `onActivated`。
    -->
    <l-data-loading-card-plan :on-mounted="load" :on-activated="activated">
      <a-tabs
        v-model:active-key="tabActiveKey"
        centered
        :items="tabs"
      >
        <template #contentRender="{item}">
          <a-space orientation="vertical" class="w-full" :size="configProviderStore.getToken().sizeMD">
            <a-spin :spinning="item.previewLoading">
              <!--
                空状态：与有数据时的轮播**同高**（那几屏是 `h-90`）+ 居中 ——
                不然一空就塌下去、还贴在左上角 ✗
              -->
              <div
                v-if="item.preview.length <= 0"
                class="flex h-90 items-center justify-center"
              >
                <a-empty />
              </div>

              <a-carousel v-else :autoplay="{ dotDuration: true }" :autoplay-speed="5000" arrows>
                <div
                  class="aspect-square h-90 overflow-hidden bg-mask"
                  :key="entity.id"
                  v-for="entity of item.preview"
                >
                  <l-basic-image
                    :preview="false"
                    class="size-full object-cover"
                    :src="getCoverImageSrc(entity?.cover)"
                  />
                </div>
              </a-carousel>
            </a-spin>

            <!--
              每个 tab 一个网格实例（同一份声明，用 `:query` 区分类型）：
              **`v-if` 懒挂载** ⇒ 首屏取数交给组件（`immediate` 默认开），切回页面交给
              `refreshOnActivate`（默认开）—— 页面不再手写取数时机、也不再拿 `instance.refs` 去调 `fetchDataSource`。
            -->
            <l-crud-card-grid-page
              v-if="tabActiveKey === item.key"
              :key="item.key"
              :page="carouselHomePage"
              v-model:query="item.query"
              :drag="dragEnabled"
              @deleted="reloadActivePreview"
            >
              <template #title>
                {{ item.label }}{{ $t('resourceServer.carousel.dataContent') }}
              </template>
              <!--
                卡片本体：给了 `#item` ⇒ 网格内置那张卡（含动作行与拖拽柄）不再渲染，
                这两样要自己画（参数里都给了）。
              -->
              <template #item="{ record, itemActions, dragEnabled: itemDragEnabled, onDragStart, onDragEnd }">
                <a-badge-ribbon
                  :text="getEnumName(record.status)"
                  :color="statusSetting[getEnumValue(record.status ?? 0) as keyof typeof statusSetting]?.color || 'blue'"
                >
                  <a-tooltip>
                    <template #title>
                      <a-space orientation="vertical">
                        <span>{{ $t('resourceServer.carousel.showtime') }}: {{ record.showtime ? dateTimeFormat(record.showtime) : $t('resourceServer.carousel.immediately') }}</span>
                        <span>{{ $t('common.expiresTime') }}: {{ record.expirationTime ? dateTimeFormat(record.expirationTime) : $t('common.permanent') }}</span>
                      </a-space>
                    </template>
                    <a-card size="small" :title="record.name">
                      <template #cover>
                        <div class="aspect-square rounded-none w-full overflow-hidden">
                          <l-basic-image
                            class="size-full object-cover"
                            @click.stop
                            :src="getCoverImageSrc(record.cover)"
                          />

                        </div>
                      </template>
                      <template #actions>
                        <l-action-button
                          size="small"
                          type="text"
                          always-dropdown
                          :actions="itemActions"
                          @click.stop
                        />
                        <div
                          v-if="itemDragEnabled"
                          class="text-center cursor-grab"
                          draggable="true"
                          @click.stop
                          @dragstart="onDragStart($event)"
                          @dragend="onDragEnd"
                        >
                          <a-typography-text type="secondary">
                            ::
                          </a-typography-text>
                        </div>
                      </template>
                    </a-card>
                  </a-tooltip>
                </a-badge-ribbon>
              </template>
            </l-crud-card-grid-page>
          </a-space>
        </template>
      </a-tabs>
    </l-data-loading-card-plan>
  </div>
</template>
