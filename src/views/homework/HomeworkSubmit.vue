<script setup lang="ts">
import { ref, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { homeworkApi } from '@/api/homework'

const router = useRouter()

// ====== Upload mode ======
type UploadMode = 'file' | 'camera'
const uploadMode = ref<UploadMode>('file')

// ====== File upload ======
const fileInput = ref<HTMLInputElement | null>(null)
const files = ref<File[]>([])
const subject = ref('')
const grade = ref('')
const loading = ref(false)
const error = ref('')

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理']
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级']

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
  }
}

function removeFile(index: number) {
  files.value.splice(index, 1)
}

function onDrop(e: DragEvent) {
  if (e.dataTransfer?.files) {
    files.value = Array.from(e.dataTransfer.files)
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function getFileUrl(file: File) {
  return URL.createObjectURL(file)
}

// ====== Camera ======
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const cameraError = ref('')
let stream: MediaStream | null = null

async function startCamera() {
  cameraError.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      cameraActive.value = true
    }
  } catch {
    cameraError.value = '无法访问摄像头，请检查权限设置'
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  cameraActive.value = false
}

function capture() {
  if (!videoRef.value || !canvasRef.value) return
  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0)
  canvas.toBlob(blob => {
    if (blob) {
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' })
      files.value = [...files.value, file]
    }
  }, 'image/jpeg', 0.95)
}

function switchMode(mode: UploadMode) {
  uploadMode.value = mode
  if (mode === 'file') {
    stopCamera()
  } else {
    startCamera()
  }
}

onBeforeUnmount(() => {
  stopCamera()
})

// ====== Submit ======
async function handleSubmit() {
  if (files.value.length === 0) {
    error.value = '请至少上传一张作业图片'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const formData = new FormData()
    files.value.forEach(f => formData.append('files', f))
    if (subject.value) formData.append('subject', subject.value)
    if (grade.value) formData.append('grade', grade.value)

    const result = await homeworkApi.submit(formData)
    router.push(`/homework/result/${result.task_id}`)
  } catch (e: any) {
    error.value = e.message || '提交失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="mb-8">
      <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">提交作业</h2>
      <p class="text-ink-secondary mt-1">上传作业图片，AI 将自动识别并批改</p>
    </div>

    <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{{ error }}</div>

    <div class="card p-6 lg:p-8">
      <!-- Mode Toggle -->
      <div class="flex gap-2 mb-6">
        <button
          @click="switchMode('file')"
          :class="uploadMode === 'file' ? 'btn-primary' : 'btn-outline'"
          class="text-sm"
        >
          <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          上传文件
        </button>
        <button
          @click="switchMode('camera')"
          :class="uploadMode === 'camera' ? 'btn-primary' : 'btn-outline'"
          class="text-sm"
        >
          <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
          </svg>
          拍照上传
        </button>
      </div>

      <!-- File Upload Mode -->
      <div v-if="uploadMode === 'file'">
        <div
          @click="triggerFileInput"
          @dragover.prevent
          @drop.prevent="onDrop"
          class="border-2 border-dashed border-surface-muted rounded-xl p-10 lg:p-14 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 transition-all duration-300 mb-6"
        >
          <div class="w-14 h-14 rounded-xl bg-surface-secondary flex items-center justify-center mx-auto mb-3">
            <svg class="w-7 h-7 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p class="font-heading font-semibold text-ink text-lg">点击或拖拽上传作业图片</p>
          <p class="text-ink-muted text-sm mt-0.5">支持 JPG、PNG 格式，可一次上传多张</p>
          <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png" @change="onFileChange" class="hidden" />
        </div>
      </div>

      <!-- Camera Mode -->
      <div v-if="uploadMode === 'camera'" class="mb-6">
        <div v-if="cameraError" class="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-4">{{ cameraError }}</div>
        <div class="relative rounded-xl overflow-hidden bg-black" style="min-height: 300px;">
          <video ref="videoRef" autoplay playsinline class="w-full max-h-[400px] object-cover"></video>
          <canvas ref="canvasRef" class="hidden"></canvas>
          <div v-if="!cameraActive" class="absolute inset-0 flex items-center justify-center">
            <div class="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full"></div>
          </div>
        </div>
        <button
          @click="capture"
          :disabled="!cameraActive"
          class="mt-4 btn-primary text-sm"
        >
          <svg class="w-4 h-4 inline mr-1.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
          </svg>
          拍照
        </button>
      </div>

      <!-- File preview (shared) -->
      <div v-if="files.length > 0" class="flex flex-wrap gap-3 mb-6">
        <div v-for="(file, index) in files" :key="index" class="relative group">
          <div class="w-20 h-20 rounded-lg bg-surface-secondary border border-surface-muted flex items-center justify-center text-xs text-ink-muted overflow-hidden">
            <img :src="getFileUrl(file)" class="w-full h-full object-cover" />
          </div>
          <button @click="removeFile(index)" class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none">&times;</button>
        </div>
      </div>

      <!-- Fields -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        <div>
          <label class="block text-sm font-semibold text-ink mb-1.5">科目</label>
          <select v-model="subject" class="glass-input">
            <option value="">请选择</option>
            <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold text-ink mb-1.5">年级</label>
          <select v-model="grade" class="glass-input">
            <option value="">请选择</option>
            <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3">
        <button @click="handleSubmit" class="btn-primary" :disabled="loading">
          {{ loading ? '提交中...' : '提交批改' }}
        </button>
        <button @click="router.push('/homework')" class="btn-outline">取消</button>
      </div>
    </div>
  </div>
</template>