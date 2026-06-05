<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { homeworkApi } from '@/api/homework'

const router = useRouter()

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
      <!-- Upload Area -->
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

      <!-- File preview -->
      <div v-if="files.length > 0" class="flex flex-wrap gap-3 mb-6">
        <div v-for="(file, index) in files" :key="index" class="relative group">
          <div class="w-20 h-20 rounded-lg bg-surface-secondary border border-surface-muted flex items-center justify-center text-xs text-ink-muted overflow-hidden">
            <img v-if="file.type.startsWith('image/')" :src="getFileUrl(file)" class="w-full h-full object-cover" />
            <span v-else>{{ file.name.slice(-4) }}</span>
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