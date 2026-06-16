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
import {AuthServerService, ResourceServerService} from "@/apis";
import LUserSelect from "@/components/basic/UserSelect.vue";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import useApp from "antdv-next/dist/app/useApp";
import LTipTap from "@/components/tiptap/TipTap.vue";

import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import {EmailMessageService} from "@/apis/message-server/emailMessageService.ts";
import type {EmailMessageSendPayload} from "@/types/apis/message-server/emailDomain.ts";

defineOptions({
  name: 'MessageServerEmailSend',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message} = useApp()

const formRef = ref()
const service = new EmailMessageService()
const attachmentUploadRef = ref<{ upload: () => Promise<ObjectWriteResult | undefined> }>()

const options = ref<{
  form:EmailMessageSendPayload
  typeOptions:NameValueEnumMetadata<number>[] | number[]
  channelOptions:NameValueEnumMetadata<number>[] | number[]
  loading:boolean
}>({
  loading: false,
  form: {
    toEmails: [],
    type: 10,
    content:"",
    title: "",
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
    await attachmentUploadRef.value?.upload()
    const result = await service.send(options.value.form);
    const data = result.data
    if (Array.isArray(data)) {
      globalProperties.$router.push({name:'message_server_email'})
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
          <a-form-item :label="globalProperties.$t('common.type')" name="type">
            <a-select v-model:value="options.form.type" :options="options.typeOptions" :field-names="{label:'name'}">
            </a-select>
          </a-form-item>
          <a-form-item :label="globalProperties.$t('common.email')" name="toEmails" :rules="[{required: true,type:'array', trigger: 'change'}]">
            <l-user-select :query="{'filter_[email_nen]':'true'}" v-model:value="options.form.toEmails" mode="tags">
              <template #optionRender="{ option }">
                <template v-if="option.data.payload">
                  <a-tooltip :title="globalProperties.$t('common.verified',{name:':' + getEnumName(option.data?.payload.emailVerified)})">
                    <a-typography-text :type="getEnumValue(option.data?.payload.emailVerified) === 1 ? 'success' : 'warning'">

                      {{ AuthServerService.getPrincipalNameByUserDetails(option.data?.payload) }}
                      ({{ option.data?.payload?.email }})
                    </a-typography-text>
                  </a-tooltip>
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
                <icon-font class="icon" type="loncra-send" />
              </template>
              <span>{{ globalProperties.$t('common.send') }}</span>
            </a-button>

            <a-button html-type="reset" :disabled="options.loading">
              <template #icon>
                <icon-font class="icon" type="loncra-history" />
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>
          </a-space>
        </l-form>
      </a-spin>
    </l-menu-title-card>
  </div>
</template>
