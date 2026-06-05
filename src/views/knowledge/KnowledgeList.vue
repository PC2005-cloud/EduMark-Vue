<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { knowledgeApi } from '@/api/knowledge'
import { useAuthStore } from '@/stores/auth'
import type { KnowledgeOut } from '@/types/knowledge'

const auth = useAuthStore()
const filterMode = ref<'all' | 'my'>('all')
const records = ref<KnowledgeOut[]>([])
const allRecords = ref<KnowledgeOut[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)

onMounted(() => load())

async function load() {
  loading.value = true
  try {
    const res = await knowledgeApi.page({
      page_num: 1,
      page_size: 100,
      sort_fields: [{ field: 'create_time', direction: 'desc' }],
    })
    allRecords.value = res.rows
    applyPagination()
  } catch {
    // silent
  } finally {
    loading.value = false
  }
}

function applyPagination() {
  const items = filterMode.value === 'all'
    ? allRecords.value
    : allRecords.value.filter(r => r.user_id === auth.user?.id)
  total.value = items.length
  pageNum.value = 1
  records.value = items.slice(0, pageSize)
}

function setFilter(mode: 'all' | 'my') {
  filterMode.value = mode
  applyPagination()
}

function setPage(n: number) {
  pageNum.value = n
  const items = filterMode.value === 'all'
    ? allRecords.value
    : allRecords.value.filter(r => r.user_id === auth.user?.id)
  const start = (n - 1) * pageSize
  records.value = items.slice(start, start + pageSize)
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// Upload modal
const showUpload = ref(false)
const uploadFileInput = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)
const uploadSubject = ref('')
const uploadGrade = ref('')
const uploading = ref(false)
const uploadError = ref('')

const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理']
const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级']

// Detail modal
const showDetail = ref(false)
const detailDoc = ref<KnowledgeOut | null>(null)

function openDetail(doc: KnowledgeOut) {
  detailDoc.value = doc
  showDetail.value = true
}

function triggerFileUpload() {
  uploadFileInput.value?.click()
}

function onUploadFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    uploadFile.value = input.files[0]
  }
}

async function handleUpload() {
  if (!uploadFile.value) {
    uploadError.value = '请选择文件'
    return
  }
  uploading.value = true
  uploadError.value = ''
  try {
    const formData = new FormData()
    formData.append('file', uploadFile.value)
    if (uploadSubject.value) formData.append('subject', uploadSubject.value)
    if (uploadGrade.value) formData.append('grade', uploadGrade.value)
    await knowledgeApi.upload(formData)
    showUpload.value = false
    uploadFile.value = null
    uploadSubject.value = ''
    uploadGrade.value = ''
    load()
  } catch (e: any) {
    uploadError.value = e.message || '上传失败'
  } finally {
    uploading.value = false
  }
}

async function handleDelete(id: number) {
  if (!confirm('确定删除该文档吗？')) return
  try {
    await knowledgeApi.delete(id)
    load()
  } catch {
    // silent
  }
}

function statusTag(status: string) {
  const map: Record<string, string> = { completed: 'tag-success', parsing: 'tag-processing', pending: 'tag-pending', failed: 'tag-failed' }
  return map[status] || 'tag-pending'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { completed: '已完成', parsing: '解析中', pending: '待处理', failed: '失败' }
  return map[status] || status
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div>
        <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">知识库</h2>
        <p class="text-ink-secondary mt-1">管理教学知识文档，辅助 AI 批改</p>
      </div>
      <button v-if="auth.canManageKnowledge" @click="showUpload = true" class="btn-primary">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        上传文档
      </button>
    </div>

    <!-- Upload modal -->
    <div v-if="showUpload" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" @click.self="showUpload = false">
      <div class="card p-6 w-full max-w-md mx-4 animate-slide-up" @click.stop>
        <h3 class="font-heading font-semibold text-ink text-lg mb-4">上传知识文档</h3>
        <div v-if="uploadError" class="mb-3 p-2 rounded-lg bg-red-50 text-sm text-red-700">{{ uploadError }}</div>
        <div class="space-y-4">
          <div @click="triggerFileUpload" class="border-2 border-dashed border-surface-muted rounded-xl p-6 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/40 transition-all duration-200">
            <p v-if="!uploadFile" class="text-sm text-ink-muted">点击选择文件（PDF/Word/PPT）</p>
            <p v-else class="text-sm font-medium text-ink">{{ uploadFile.name }}</p>
            <input ref="uploadFileInput" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" class="hidden" @change="onUploadFileChange" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-ink mb-1">科目</label>
              <select v-model="uploadSubject" class="glass-input">
                <option value="">不限</option>
                <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-ink mb-1">年级</label>
              <select v-model="uploadGrade" class="glass-input">
                <option value="">不限</option>
                <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="handleUpload" class="btn-primary" :disabled="uploading">{{ uploading ? '上传中...' : '上传' }}</button>
            <button @click="showUpload = false" class="btn-outline">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter toggle (for teachers/admins) -->
    <div v-if="auth.canManageKnowledge" class="mb-4 flex items-center gap-1 bg-surface-secondary rounded-xl p-1 w-fit text-sm">
      <button @click="setFilter('all')" :class="['px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer border-none', filterMode === 'all' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink']">全部知识</button>
      <button @click="setFilter('my')" :class="['px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer border-none', filterMode === 'my' ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink']">我的知识</button>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left">
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">文档名称</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">科目</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">年级</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">知识块</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">上传时间</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-muted">
            <tr v-for="doc in records" :key="doc.id" class="hover:bg-surface-secondary transition-colors">
              <td class="px-6 py-4 text-sm font-medium text-ink max-w-48 truncate">{{ doc.title }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.subject || '-' }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.grade || '-' }}</td>
              <td class="px-6 py-4">
                <span v-if="doc.status === 'parsing'" class="tag tag-processing">
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-500 mr-1.5 animate-pulse-dot"></span>
                  {{ statusLabel(doc.status) }}
                </span>
                <span v-else :class="['tag', statusTag(doc.status)]">{{ statusLabel(doc.status) }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.status === 'completed' ? doc.chunk : '-' }}</td>
              <td class="px-6 py-4 text-sm text-ink-muted">{{ doc.create_time?.slice(0, 16) || '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button @click="openDetail(doc)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all duration-150 cursor-pointer border-none">查看</button>
                  <button v-if="auth.isAdmin || doc.user_id === auth.user?.id" @click="handleDelete(doc.id)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-150 cursor-pointer border-none">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-ink-muted text-sm">{{ loading ? '加载中...' : '暂无知识文档' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="flex items-center justify-between px-6 py-4 border-t border-surface-muted">
        <span class="text-sm text-ink-muted">共 {{ total }} 条</span>
        <div class="flex gap-1">
          <button @click="setPage(pageNum - 1)" :disabled="pageNum <= 1"
            class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 transition-all duration-150 text-sm disabled:opacity-40">&lt;</button>
          <button v-for="p in Math.min(totalPages, 5)" :key="p" @click="setPage(p)"
            class="cursor-pointer w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-150"
            :class="p === pageNum ? 'bg-brand-600 text-white' : 'border border-surface-muted text-ink-muted hover:border-brand-300 hover:text-brand-600'">{{ p }}</button>
          <button @click="setPage(pageNum + 1)" :disabled="pageNum >= totalPages"
            class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 transition-all duration-150 text-sm disabled:opacity-40">&gt;</button>
        </div>
      </div>
    </div>

    <!-- Detail modal -->
    <div v-if="showDetail && detailDoc" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" @click.self="showDetail = false">
      <div class="card p-6 w-full max-w-lg mx-4 animate-slide-up" @click.stop>
        <h3 class="font-heading font-semibold text-ink text-lg mb-4">知识文档详情</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">文档名称</span>
            <span class="col-span-2 text-ink">{{ detailDoc.title }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">科目</span>
            <span class="col-span-2 text-ink">{{ detailDoc.subject || '-' }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">年级</span>
            <span class="col-span-2 text-ink">{{ detailDoc.grade || '-' }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">状态</span>
            <span class="col-span-2"><span :class="['tag', statusTag(detailDoc.status)]">{{ statusLabel(detailDoc.status) }}</span></span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">知识块数</span>
            <span class="col-span-2 text-ink">{{ detailDoc.chunk || '-' }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">上传时间</span>
            <span class="col-span-2 text-ink">{{ detailDoc.create_time?.slice(0, 16) || '-' }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">文档ID</span>
            <span class="col-span-2 text-ink font-mono">{{ detailDoc.id }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <span class="font-semibold text-ink-muted">上传者</span>
            <span class="col-span-2 text-ink">{{ detailDoc.user_id === auth.user?.id ? '我' : `用户 #${detailDoc.user_id}` }}</span>
          </div>
        </div>
        <div class="flex justify-end mt-6">
          <button @click="showDetail = false" class="btn-outline">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>