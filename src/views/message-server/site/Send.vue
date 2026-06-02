<script setup lang="ts">
import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {
  BatchResponse,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  ObjectWriteResult,
  RestResult
} from "@/types/apis";
import {ResourceServerService} from "@/apis";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LUserSelect from "@/components/basic/UserSelect.vue";
import {requireNonNullOrUndefined} from "@/utils";
import {SiteMessageService} from "@/apis/message-server";
import useApp from "antdv-next/dist/app/useApp";
import type {SiteMessageSendPayload} from "@/types/apis/message-server/siteDomain.ts";
import LTipTap from "@/components/tiptap/TipTap.vue";

import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineOptions({
  name: 'MessageServerSiteSend',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore()

const {message} = useApp()

const formRef = ref()
const service = new SiteMessageService()
const coverUploadRef = ref<{ upload: () => Promise<ObjectWriteResult | undefined> }>()
const attachmentUploadRef = ref<{ upload: () => Promise<ObjectWriteResult | undefined> }>()

const options = ref<{
  form:SiteMessageSendPayload
  typeOptions:NameValueEnumMetadata<number>[] | number[]
  channelOptions:NameValueEnumMetadata<number>[] | number[]
  loading:boolean
}>({
  loading: false,
  form: {
    toUsers: [],
    type: 10,
    content:"",
    title: "",
    pushable: 1,
    channels:[],
    attachmentList: [],
    remark:"",
    metadata: {}
  },
  typeOptions:[],
  channelOptions:[],
})

function onFinish(){
  formRef.value.validate().then(() => doSubmit())
}

async function doSubmit(){
  options.value.loading = true;
  try {
    await Promise.all([coverUploadRef.value?.upload(), attachmentUploadRef.value?.upload()])
    const result = await service.send(options.value.form);
    const data = result.data
    if (Array.isArray(data)) {
      globalProperties.$router.push({name:'message_server_site'})
    } else if (typeof (data as BatchResponse)) {
      const response = data as BatchResponse;
      globalProperties.$router.push({name:'message_server_batch_detail', query:{id:response.batchId}})
    }
    message.success(result.message)
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    options.value.loading = false;
  }
}

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({"message-server":[{"id":"SiteMessagePushableChannelEnum"},{"id":"MessageTypeEnum"}]})
  if (enums.data) {
    options.value.typeOptions = enums.data['message-server']?.MessageTypeEnum as NameValueEnumMetadata<number>[]
    options.value.channelOptions = enums.data['message-server']?.SiteMessagePushableChannelEnum as NameValueEnumMetadata<number>[]
  }

}

onMounted(mounted);
</script>

<template>
  <div>
    <l-menu-title-card>
      <a-spin :spinning="options.loading" >
        <l-form ref="formRef" @finish="onFinish" :model="options.form">
          <a-form-item :message-variables="{ label: globalProperties.$t('common.cover') }" name="cover">
            <l-attachment-upload
              mode="picture-card"
              accept=".jpg,.jpeg,.png"
              ref="coverUploadRef"
              :classes="{
                item:'w-[425px] h-[225px]',
                list:'w-full justify-center',
                meta:'w-[425px] mt-xxs max-w-full min-w-0'
              }"
              :max-count="1"
              :multiple="false"
              v-model:value="options.form.cover"
            >
              <template #itemTitle>
                <a-typography-text ellipsis>
                  {{options.form.title}}
                </a-typography-text>
              </template>
              <template #uploadDescription>
                {{globalProperties.$t('common.cover')}}
              </template>
              <template #itemDescription>
                <a-typography-paragraph class="m-0" type="secondary" :ellipsis="{ rows: 3 }">
                  {{options.form.content.replace(/<[^>]*>/g, '')}}
                </a-typography-paragraph>
              </template>
            </l-attachment-upload>
          </a-form-item>

          <a-row :gutter="configProviderStore.getToken().sizeMD">
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item :label="globalProperties.$t('common.type')" name="type" >
                <a-select v-model:value="options.form.type" :options="options.typeOptions" :field-names="{label:'name'}">
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item :label="globalProperties.$t('messageServer.site.channel')" name="channels" :rules="options.form.pushable === 1 ? [{required: true, trigger: 'change'}] : undefined">
                <a-space-compact block>
                  <a-select mode="multiple" :disabled="options.form.pushable !== 1" :options="options.channelOptions" :field-names="{label:'name'}" v-model:value="options.form.channels" />
                  <a-space-addon>
                    <a-switch
                      v-model:value="options.form.pushable"
                      :un-checked-value="0"
                      :checked-value="1"
                      :checked-children="globalProperties.$t('common.enabled')"
                      :un-checked-children="globalProperties.$t('common.disabled')"
                    />
                  </a-space-addon>
                </a-space-compact>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item :label="globalProperties.$t('auth.principal')" name="toUsers" :rules="[{required: true,type:'array', trigger: 'change'}]">
            <l-user-select v-model:value="options.form.toUsers" mode="multiple">
              <template #optionRender="{ option }">
                <template v-if="option.data.payload">
                  {{option.data?.payload?.realName || option.data?.payload?.username}}
                </template>
                <template v-else>
                  {{option.data.label}}
                </template>
              </template>
            </l-user-select>
          </a-form-item>
          <a-form-item :label="globalProperties.$t('common.title')" name="title" :rules="[{required: true, trigger: 'change'}]">
            <a-input v-model:value="options.form.title" />
          </a-form-item>
          <a-form-item :label="globalProperties.$t('common.content')" name="content" :rules="[{required: true, trigger: 'change'}]">
            <l-tip-tap
              v-model:value="options.form.content"
              model="html"
              class="min-h-100 max-h-120"
              :toolbar="{ items: ['undo', 'redo', 'divider', 'bold', 'italic', 'underline', 'blockquote', 'heading', 'divider', 'list', 'align', 'divider', 'link', 'picture'] }"
            />
          </a-form-item>
          <a-form-item :label="globalProperties.$t('attachment.text')" name="attachmentList">
            <l-attachment-upload
              ref="attachmentUploadRef"
              mode="dragger"
              v-model:value="options.form.attachmentList"
            />
          </a-form-item>

          <a-form-item :label="globalProperties.$t('common.remark')" name="remark">
            <a-textarea v-model:value="options.form.remark" :auto-size="{ minRows: 5, maxRows: 10 }"/>
          </a-form-item>

          <a-divider />
          <a-space>
            <a-button type="primary" html-type="submit" :loading="options.loading">
              <template #icon>
                <icon-font class="icon" type="icon-send-fill" />
              </template>
              <span>{{ globalProperties.$t('common.send') }}</span>
            </a-button>

            <a-button html-type="reset" :disabled="options.loading">
              <template #icon>
                <icon-font class="icon" type="icon-time-history" />
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>
          </a-space>
        </l-form>
      </a-spin>
    </l-menu-title-card>
  </div>
</template>
