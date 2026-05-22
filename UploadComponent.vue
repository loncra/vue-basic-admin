<template>
  <a-spin :tip="uploadOptions.tip" :spinning="spinning">
    <template v-if="props.mode === 'upload-dragger'">
      <div v-if="fileListValue.length > 0" class="margin-bottom-lg ">
        <a-list class="upload-list attachment" item-layout="horizontal" :data-source="fileListValue">
        <template #header v-if="!preview">
          <div class="margin-left">
            <icon-font class="icon" type="icon-attachment"/>
            待上传文件
          </div>
        </template>
        <template #renderItem="{ item:fileItem }">
          <a-list-item :key="fileItem.uid || fileItem.objectName">
            <template #actions>
              <a-button v-if="!preview" danger type="primary" @click="globalProperties.$confirm('确定删除 [' +  fileItem.name + '] 文件吗?', () => deleteFile(fileItem.uid))">
                <icon-font class="icon" type="icon-ashbin"/>
                <span class="hidden-md hidden-sm hidden-xs">删除</span>
              </a-button>

              <a-button v-else type="primary" @click="downloadResourceAttachment(fileItem.bucketName, fileItem.objectName)">
                <icon-font class="icon" type="icon-ashbin"/>
                <span class="hidden-md hidden-sm hidden-xs">下载</span>
              </a-button>
            </template>
            <a-list-item-meta>
              <template #title>
                <a-typography-text v-if="!preview" :type="getFileItemStatusClass(fileItem)" :ellipsis="{tooltip: fileItem.name + ' ' + globalProperties.byteFormat(fileItem.size)}" :content="fileItem.name + ' ' + globalProperties.byteFormat(fileItem.size)"/>
                <a-typography-link v-else href="javascript:;" @click="downloadResourceAttachment(fileItem.bucketName, fileItem.objectName)">
                  {{ fileItem?.extraHeaders['x-amz-meta-original-filename'] || fileItem.objectName }}
                </a-typography-link>
              </template>
              <template #description >
                <a-progress v-if="!preview" :percent="fileItem.percent" :status="fileItem.status === 'uploading' ? 'active' : fileItem.status === 'error' ? 'exception' : fileItem.status === 'done' ? 'success' : 'normal'"/>
                <template v-else>
                  桶位置:{{ fileItem.bucketName }}
                </template>
              </template>
              <template #avatar>
                <a-typography-text  v-if="!preview" :type="getFileItemStatusClass(fileItem)">
                  <icon-font class="icon upload-file" :type="getFileIcon(fileItem.name)"/>
                </a-typography-text>
                <a-typography-link v-else href="javascript:;" @click="downloadResourceAttachment(fileItem.bucketName, fileItem.objectName)" >
                  <icon-font class="icon upload-file" :type="getFileIcon(fileItem.objectName)"/>
                </a-typography-link>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
      </div>
      <a-upload-dragger v-if="!preview"
                        v-model:fileList="fileListValue"
                        :multiple="props.multiple"
                        :action="props.action"
                        :accept="props.accept"
                        :max-count="props.maxCount"
                        :before-upload="() => false"
                        :show-upload-list="false">
        <a-typography-text type="secondary">
          <icon-font class="icon upload-icon" type="icon-upload-report"/>
        </a-typography-text>

        <a-typography-title :level="4">双击或拖动文件到此区域进行上传</a-typography-title>
        <a-typography-text type="secondary">支持单个或批量上传，严格禁止上传公司数据或其他受限制的文件。</a-typography-text>

      </a-upload-dragger>
    </template>
    <template v-if="props.mode === 'picture-card'">
      <a-upload
        v-model:file-list="fileListValue"
        :accept="props.accept"
        list-type="picture-card"
        class="upload-picture-card"
        :multiple="props.multiple"
        :action="props.action"
        :max-count="props.maxCount"
        :before-upload="validateFile"
        @change="onPictureCardPreview"
        v-if="!preview" >

        <template #itemRender="{ file, actions }">
          <a-card >
            <template #cover>
              <a-image :preview="false" style="margin-left: 1px" :width="100" :height="100" v-if="file.preview || file.type.includes('image/')" :src="file.preview || file.url" />
              <div class="padding text-align-center" v-else >
                <icon-font style="font-size: 68px" :type="getFileIcon(file.name || file.extraHeaders['x-amz-meta-original-filename'])" />
              </div>
            </template>
            <template #actions >
              <a-button type="text" size="small" @click="onPictureCardClick(file)" :disabled="!file.preview && !file.url">
                <icon-font type="icon-eye-open" />
              </a-button>
              <a-button type="text" danger  size="small" @click="globalProperties.$confirm('确定要删除 ' + file.name + ' 文件吗?', () => onPictureCardRemove(file));">
                <icon-font type="icon-circle-close" />
              </a-button>
            </template>

          </a-card>
        </template>

        <a-space direction="vertical" v-if="fileListValue.length < props.maxCount && !preview">
          <a-typography-text type="secondary">
            <icon-font class="icon upload-icon picture-card" type="icon-circle-add" />
          </a-typography-text>
          <a-typography-text >
            上传文件
          </a-typography-text>
        </a-space>

      </a-upload>
      <template v-else>
        <a-space class="margin-bottom-lg" :size="[configProviderStore.getToken().margin, configProviderStore.getToken().margin]" wrap>
          <a-card :body-style="{padding:0}" @click="onPictureCardClick(file)" hoverable style="width: 100px;height: 100px " v-for="file in fileListValue">
            <a-image class="border-radius" :preview="false" :width="98" :height="98" :src="file.url" v-if="file.type.includes('image/')" />
            <div class="padding text-align-center" v-else >
              <icon-font style="font-size: 68px" :type="getFileIcon(file.name || file.extraHeaders['x-amz-meta-original-filename'])" />
            </div>
          </a-card>
        </a-space>
      </template>
      <div style="display: none">
        <a-image-preview-group :preview="{ visible:pictureCard.visible, onVisibleChange: vis => (pictureCard.visible = vis), current: pictureCard.current}">
          <a-image :alt="file.name" :width="100" :height="100" v-for="file in fileListValue" :src="file.preview || file.url" />
        </a-image-preview-group>
      </div>
    </template>
  </a-spin>

  <a-modal @cancel="closeVideoModal" @ok="closeVideoModal" class="dactiv" v-if="videoModal.src" v-model:open="videoModal.visible" :title="videoModal.title || '视频预览'" layout="vertical">
    <video
      v-if="videoModal.src"
      :src="videoModal.src"
      controls
      autoplay
      style="width: 100%; height: 400px"
    >
      您的浏览器不支持视频播放。
    </video>
  </a-modal>

<!--  <a-modal class="dactiv" width="978px" title="图片剪辑" :open="cropperImages.length > 0" :footer="null" layout="vertical">
    <a-skeleton :loading="cropperImages.filter(c => c.preview === undefined).length > 0">
      <a-row :gutter="[configProviderStore.getToken().marginLG]">
        <a-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16" :xxl="16">
          <template v-if="cropperImages.find(i => i.selected)">
            <a-spin :spinning="cropperImages.find(i => i.selected).cutting" tip="裁剪中...">
              <vue-cropper ref="cropperRef"
                           output-type="image/jpeg"
                           :aspect-ratio="4 / 3"
                           :src="cropperImages.find(i => i.selected).preview"
                           preview=".cropper-preview"
              ></vue-cropper>
              <a-space-compact block class="margin-top-lg justify-content-center align-items-center">
                <a-tooltip title="放大">
                  <a-button @click="cropperRef.relativeZoom(0.2);">
                    <icon-font type="icon-circle-add" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="缩小">
                  <a-button @click="cropperRef.relativeZoom(-0.2);">
                    <icon-font type="icon-circle-delete" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="左移">
                  <a-button @click="cropperRef.move(-10, 0);">
                    <icon-font type="icon-arrow-left" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="上移">
                  <a-button @click="cropperRef.move(10, 0);">
                    <icon-font type="icon-closure" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="下移">
                  <a-button @click="cropperRef.move(0, -10);">
                    <icon-font type="icon-expand" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="右移">
                  <a-button @click="cropperRef.move(0, 10);">
                    <icon-font type="icon-arrow-right" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="旋转" >
                  <a-button @click="cropperRef.rotate(90);">
                    <icon-font type="icon-flip-horizontal"  />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="压缩">
                  <a-button @click="crop">
                    <icon-font type="icon-charging-management" />
                  </a-button>
                </a-tooltip>
                <a-tooltip title="重置">
                  <a-button danger @click="cropperRef.reset();">
                    <icon-font type="icon-cancel" />
                  </a-button>
                </a-tooltip>
              </a-space-compact>
            </a-spin>
          </template>

        </a-col>
        <a-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" :xxl="8">
          <a-divider orientation="left" plain class="margin-none margin-bottom-lg">
            <a-space>
              <icon-font class="icon" type="icon-eye-open"/>
              <span class="hidden-md hidden-sm hidden-xs">预览</span>
            </a-space>
          </a-divider>
          <div class="cropper-preview border-solid border-radius"></div>
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon" type="icon-charging-management"/>
              <span class="hidden-md hidden-sm hidden-xs">压缩后</span>
            </a-space>
          </a-divider>
          <div class="cropped-image">
            <img
              class="border-solid border-radius"
              v-if="cropperImages.find(i => i.selected)?.cropImg"
              :src="cropperImages.find(i => i.selected).cropImg"
              alt="压缩后的内容"
            />
            <div v-else class="crop-placeholder" />
          </div>
        </a-col>
      </a-row>
      <template v-if="cropperImages.length > 1">
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="icon-carousel"/>
            <span class="hidden-md hidden-sm hidden-xs">图片组</span>
          </a-space>
        </a-divider>
        <a-space :size="[configProviderStore.getToken().margin]" wrap class="justify-content-center align-items-center width-percent-100">
          <a-card @click="selectCropper(img)" v-for="img of cropperImages" hoverable :body-style="{padding:0}" >
            <a-badge-ribbon :color="img.cropImg ? 'green' : 'red'" :text="img.cropImg ? '已压缩' : '未压缩'">
              <a-image class="border-radius" :preview="false" :width="98" :height="98" :src="img.preview"  />
            </a-badge-ribbon>
          </a-card>
        </a-space>
      </template>
    </a-skeleton>
  </a-modal>-->

</template>

<script>
const uploadOptionsDefault = () => ({
  param:{},
  headers:{},
  tip:'文件上传中,请等待完成...'
});
</script>

<script setup>
import pLimit from 'p-limit';
import { computed, getCurrentInstance, nextTick, ref } from 'vue'
import {
  singleUploadResourceAttachment,
  createResourceAttachmentMultipartUpload,
  downloadResourceAttachment,
  completeResourceAttachmentMultipartUpload,
  uploadResourceMultipart
} from '@/apis/resourceApi.js'
import { useConfigProviderStore } from '@/stores/configProviderStore.js'

import VueCropper from 'vue-cropperjs';
import 'cropperjs/dist/cropper.css';
import Compressor from 'compressorjs';

const configProviderStore = useConfigProviderStore();

const props = defineProps({
  postFilename:{
    type:String,
    default:() => "file"
  },
  autoUpload:{
    type:Boolean,
    default:() => false
  },
  mode:{
    type:String,
    default:() => 'picture-card'
  },
  multiple:{
    type:Boolean,
    default: () => true
  },
  action: {
    type:String,
    default:() => undefined
  },
  promiseLimit:{
    type:Number,
    default:() => 3
  },
  bucket:{
    type:String,
    default:() => "user.file"
  },
  preview:{
    type:Boolean,
    default:() => false
  },
  accept: {
    type:String,
    default:() => ""
  },
  maxCount:{
    type:Number,
    default:() => 999
  },
  uploadOptions:{
    type:Object
  }
});

const uploadOptions = computed(() => ({
  ...uploadOptionsDefault(), ...props.uploadOptions
}));

const globalProperties = getCurrentInstance().appContext.config.globalProperties;

const fileListValue = defineModel('fileList',{ type: Array, default: [] });
const emit = defineEmits(['deleteFile', 'change']);

const pictureCard = ref({
  visible:false,
  loading:false,
  current:0
});

const videoModal = ref({
  visible:false,
  src:undefined,
  title:undefined
});

const spinning = ref(false);

const attachmentFileSupport = [
  {name: "7z", icon: "icon-z"},
  {name: "avi", icon: "icon-AVI"},
  {name: "bat", icon: "icon-BAT"},
  {name: "ai", icon: "icon-AI"},
  {name: "bmp", icon: "icon-BMP"},
  {name: "css", icon: "icon-CSS"},
  {name: "conf", icon: "icon-CONF"},
  {name: "eot", icon: "icon-EOT"},
  {name: "docx", icon: "icon-DOCX"},
  {name: "doc", icon: "icon-DOC"},
  {name: "htm", icon: "icon-HTM"},
  {name: "html", icon: "icon-HTML"},
  {name: "ico", icon: "icon-ICO"},
  {name: "ini", icon: "icon-INI"},
  {name: "jar", icon: "icon-JAR"},
  {name: "java", icon: "icon-JAVA"},
  {name: "jpeg", icon: "icon-JPEG"},
  {name: "jpg", icon: "icon-JPG"},
  {name: "js", icon: "icon-JS"},
  {name: "md", icon: "icon-MD"},
  {name: "mp3", icon: "icon-MP"},
  {name: "mp4", icon: "icon-MP1"},
  {name: "mp5", icon: "icon-MP2"},
  {name: "mpge", icon: "icon-MPGE"},
  {name: "pdf", icon: "icon-PDF"},
  {name: "pl", icon: "icon-PL"},
  {name: "png", icon: "icon-PNG"},
  {name: "ppt", icon: "icon-PPT"},
  {name: "psd", icon: "icon-PSD"},
  {name: "py", icon: "icon-PY"},
  {name: "rar", icon: "icon-RAR"},
  {name: "rm", icon: "icon-RM"},
  {name: "sh", icon: "icon-SH"},
  {name: "svg", icon: "icon-SVG"},
  {name: "ttf", icon: "icon-TTF"},
  {name: "tar", icon: "icon-TAR"},
  {name: "text", icon: "icon-TEXT"},
  {name: "xlsx", icon: "icon-XLSX"},
  {name: "woff", icon: "icon-WOFF"},
  {name: "xml", icon: "icon-XML"},
  {name: "yml", icon: "icon-YML"},
  {name: "yaml", icon: "icon-YAML"},
  {name: "zip", icon: "icon-ZIP"},
  {name: "bin", icon: "icon-BIN"}
];

const cropperImages = computed(() => (fileListValue.value || []).filter(f => f.originFileObj).filter(f => f.type.includes('image/')));
const cropperRef = ref();

function selectCropper(image) {
  fileListValue.value.filter(f => f.originFileObj).filter(f => f.type.includes('image/')).forEach(f => f.selected = false);
  const target = fileListValue.value.find(v => v.uid === image.uid);
  if (!target) {
    return ;
  }
  nextTick(() => target.selected = true);
  //cropperRef.value.reset();
}

function crop() {
  const images = fileListValue.value.filter(f => f.originFileObj).filter(f => f.type.includes('image/'));
  const current = images.find(f => f.selected);

  const canvas = cropperRef.value.getCroppedCanvas();
  if (!canvas)  {
    return;
  }

  const index = images.indexOf(current);

  nextTick(() => current.cropImg = canvas.toDataURL());

  current.cutting = true;
  canvas.toBlob((blob) => {
    if (!blob)  {
      current.cutting = false;
      return;
    }
    // 使用compressorjs进一步压缩（可选）
    new Compressor(blob, {
      quality: 0.5, // 压缩质量
      mimeType: current.type, // 输出格式
      success: (compressedBlob) => {
        current.blob = compressedBlob;
        if (index < images.length - 1) {
          current.selected = false;
          nextTick(() => fileListValue.value[index + 1].selected = true);
        }
        current.cutting = false;
      },
      error: (err) => {
        globalProperties.$message.error('压缩失败:', err);
        current.cutting = false;
      },
    });
  }, current.type);
}

function validateFile(file, fileList){
  if (props.accept) {
    const accepts = props.accept.split(",");
    if (!accepts.some(a => file.name.endsWith(a))) {
      globalProperties.$message.warning("仅支持上传 " + accepts.join(", ") + " 文件")
    }
  }
  return false;
}

function onPictureCardClick(file) {
  if (file.type.includes("image/")) {
    pictureCard.value.visible = true;
    pictureCard.value.current = fileListValue
      .value
      .filter(f => f.type.includes("image/"))
      .findIndex(s => s.id === file.id);
  } else if (file.type.includes("video/")) {
    videoModal.value.src = file.url;
    videoModal.value.visible = true;
    videoModal.value.title = file.name;
  }
}

function closeVideoModal(){
  videoModal.value.src = undefined;
  videoModal.value.visible = false;
  videoModal.value.title = undefined;
}

function onPictureCardPreview(info) {

  if (props.accept) {
    const accepts = props.accept.split(",");
    info.fileList = info.fileList.filter(f => accepts.some(a => f.name.endsWith(a)));
  }

  fileListValue.value = info.fileList;
  for (const file of info.fileList.filter(f => f.originFileObj)) {
    if (file.type.includes("image/")) {
      globalProperties
        .getImageBase64(file.originFileObj)
        .then(d => fileListValue.value.find(f => f.uid === file.uid).preview = d)
      file.selected = false;
      file.cutting = false;
    } else if (file.type.includes("video/")) {
      const getVideoThumbnail = function(d) {
        file.preview = d.base64;
        file.url = d.videoUrl
      }
      globalProperties.getVideoThumbnail(file.originFileObj).then(getVideoThumbnail);
    }
  }
  const fileObject = info.fileList.filter(f => f.type.includes("image/")).find(f => f.originFileObj);
  if (fileObject) {
    fileObject.selected = true;
  }

  emit('change', info.fileList)
}

function onPictureCardRemove(file) {
  if (file.uid) {
    fileListValue.value = fileListValue.value.filter(f => f.uid !== file.uid);
  } else {
    fileListValue.value = fileListValue.value.filter(f => f.id !== file.id);
  }
  emit("deleteFile", file);
}

function getFileItemStatusClass(item) {
  if (item.status === 'uploading' || !item.status) {
    return 'secondary';
  } else if (item.status === 'error') {
    return "danger";
  } else if (item.status === "done") {
    return "success";
  } else {
    return 'secondary';
  }
}

function getFileIcon(filename) {

  if (!filename) {
    return "icon-unkown";
  }

  let index = filename.lastIndexOf(".");

  if (index < 0) {
    return "icon-unkown";
  }

  let suffix = filename.substring(index + 1, filename.length);

  let icon = attachmentFileSupport.find(a => a.name === suffix);

  if (!icon) {
    return "icon-unkown";
  }

  return icon.icon
}

function deleteFile(object) {
  fileListValue.value = fileListValue.value.filter(a => a.uid !== object);
  emit("deleteFile", object);
}

function upload() {
  spinning.value = true;
  const files = fileListValue.value.filter(f => !f.bucketName && !f.objectName);
  if (files.length <= 0) {
    spinning.value = false;
    return Promise.resolve([]);
  }
  return Promise.all(files.map(f => uploadFile(f, props.bucket, uploadOptions)));
}

function singleUpload(file, type, uploadOptions) {
  const config = {
    onUploadProgress: function (event) {
      file.percent = Math.floor((event.loaded * 100) / file.size);
      if (file.percent >= 100) {
        file.status = 'done';
      } else {
        file.status = 'uploading'
      }
    },
    headers: {'Content-Type': 'multipart/form-data', ...uploadOptions.headers || {}}
  }

  const formData = new FormData();
  formData.append(props.postFilename, file.originFileObj);

  if (uploadOptions.value.param) {
    for (const key in uploadOptions.value.param) {
      formData.append(key, uploadOptions.value.param[key]);
    }
  }

  return new Promise((resolve, reject) => {
    singleUploadResourceAttachment(type, formData, config)
      .then(response => uploadSuccessResolve(resolve, response, type, file))
      .catch(reason => uploadCatch(reason, file, reject));
  })
}

function uploadSuccessResolve(resolve, response, type, file) {
  spinning.value = false;
  resolve({ response, type, file })
}

function multipartChunkAllSuccess(response,
                                  parts,
                                  bucket,
                                  file,
                                  resolve,
                                  reject,
                                  uploadOptions) {

  const {uploadId} = response.data.data;

  const completeConfig = {...(uploadOptions.headers||{})};
  const data = {
    uploadId,
    parts
  }
  completeResourceAttachmentMultipartUpload(data, completeConfig)
    .then(response => uploadSuccessResolve(resolve, response, bucket, file))
    .catch(reason => uploadCatch(reason, file, reject));
}

function createMultipartUploadSuccess(response,
                                      bucket,
                                      file,
                                      resolve,
                                      reject,
                                      uploadOptions) {
  if (response.data.data.chunk <= 0) {
    uploadCatch("没有可使用的分片上传路径", file, reject);
    return;
  }

  const data = [];
  let countSize = 0;
  for (let i = 1; i <= response.data.data.chunk; i++) {
    const nextSize = Math.min(i * response.data.data.uploadBlockSize, file.size);
    const fileData = file.originFileObj.slice((i - 1) * response.data.data.uploadBlockSize, nextSize);
    const info = {
      id: i,
      uploadSize: 0
    };

    const config = {
      onUploadProgress: function (event) {
        const d = data.find(d => d.id === i);
        d.uploadSize = event.loaded;
        file.percent = Math.floor((data.reduce((sum, d) => sum + d.uploadSize, 0) * 100) / file.size);
        if (file.percent >= 100) {
          file.status = 'done';
        } else {
          file.status = 'uploading'
        }
      }
    }
    countSize += fileData.size;
    const formData = new FormData();
    formData.append(props.postFilename, fileData);
    info.promise = uploadResourceMultipart(
      i,
      response.data.data.uploadId,
      formData,
      config
    );
    data.push(info);
  }

  const limit = pLimit(props.promiseLimit);
  const promises = data.map(({ promise }) => limit(() => promise));

  Promise
    .all(promises)
    .then(chunk => chunk.map(({data:{data:{etag,partNumber}}}) => ({id:etag,value:partNumber})))
    .then((parts) => multipartChunkAllSuccess(response, parts, bucket, file, resolve, reject, uploadOptions))
    .catch(reason => uploadCatch(reason, file, reject));
}

function uploadCatch(reason, file, reject) {
  spinning.value = false;
  file.status = 'error';
  reject(reason);
}

function multipartUpload(file, bucket, uploadOptions) {
  let param = {
    objectName: file.name,
    size: file.size,
    contentType:file.type
  }

  if (uploadOptions.value.param) {
    for (const key in uploadOptions.value.param) {
      param[key] = uploadOptions.value.param[key];
    }
  }

  return new Promise((resolve, reject) => {
    createResourceAttachmentMultipartUpload(bucket, globalProperties.formUrlEncoded(param))
      .then(response => createMultipartUploadSuccess(response, bucket, file, resolve, reject, uploadOptions))
      .catch(reason => uploadCatch(reason, file, reject))
  });
}

function uploadFile(file, bucket, uploadOptions) {
  if (!file || !file.originFileObj) {
    return Promise.reject("上传文件不能为空");
  }
  // FIXME 这里应该读取服务器去获取是否分片
  const uploadBlockSize = import.meta.env.VITE_APP_UPLOAD_BLOCK_SIZE * 1;
  if (file.size < uploadBlockSize) {
    return singleUpload(file, bucket, uploadOptions);
  } else {
    return multipartUpload(file, bucket, uploadOptions);
  }

}

// 暴露函数给外部使用
defineExpose({
  upload,
  uploadFile
});

</script>

<style scoped>

.upload-file {
  font-size: 46px;
  margin-top: 2px;
}

.upload-icon {
  font-size: 48px;
}

.upload-icon.picture-card {
  font-size: 32px;
}

.cropper-preview {
  width: 100%;
  height: calc(372px * (9 / 16));
  margin: 0 auto;
  overflow: hidden;
}

.crop-placeholder {
  width: 100%;
  height: 200px;
  background: #ccc;
}

.cropped-image img {
  max-width: 100%;
}

</style>
