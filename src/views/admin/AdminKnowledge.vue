<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { knowledgeApi } from '@/api/knowledge'
import { userApi } from '@/api/user'
import type { KnowledgeOut } from '@/types/knowledge'

// === Filters ===
const filterStatus = ref('')
const filterUserId = ref<number | undefined>(undefined)

const filtered = computed(() => {
  let items = [...allRecords.value]
  if (filterStatus.value) {
    items = items.filter(d => d.status === filterStatus.value)
  }
  if (filterUserId.value) {
    items = items.filter(d => d.user_id === filterUserId.value)
  }
  return items
})

// === Pagination (frontend) ===
const pageSize = 10
const pageNum = ref(1)
const total = computed(() => filtered.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const records = computed(() => {
  const start = (pageNum.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

function setPage(n: number) {
  pageNum.value = n
}

function applyFilters() {
  pageNum.value = 1
}

function resetFilters() {
  filterStatus.value = ''
  filterUserId.value = undefined
  pageNum.value = 1
}

// === Data ===
const loading = ref(false)
const allRecords = ref<KnowledgeOut[]>([])

async function load() {
  loading.value = true
  try {
    const res = await knowledgeApi.page({ page_num: 1, page_size: 100, sort_fields: [{ field: 'create_time', direction: 'desc' }] })
    allRecords.value = res.rows
  } catch { /* silent */ }
  finally { loading.value = false }
}

// Build user_id → username map & user list for dropdown
const userMap = ref<Record<number, string>>({})
const userList = ref<{ id: number; name: string }[]>([])
async function loadUsers() {
  try {
    const res = await userApi.page({ page_num: 1, page_size: 100 })
    const map: Record<number, string> = {}
    const list: { id: number; name: string }[] = []
    res.rows.forEach(u => {
      map[u.id] = u.username
      // 知识文档仅老师上传
      if (u.role === 'teacher') list.push({ id: u.id, name: u.username })
    })
    userMap.value = map
    userList.value = list.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  } catch { /* silent */ }
}

onMounted(() => {
  load()
  loadUsers()
})

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
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">知识预览</h2>
        <p class="text-ink-secondary mt-1">查看所有用户上传的知识文档</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-ink-muted">状态</label>
          <select v-model="filterStatus"
            class="rounded-lg border border-surface-muted px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 min-w-[120px]">
            <option value="">全部</option>
            <option value="pending">待处理</option>
            <option value="parsing">解析中</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-ink-muted">用户</label>
          <select v-model="filterUserId"
            class="rounded-lg border border-surface-muted px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 min-w-[140px]">
            <option :value="undefined">全部用户</option>
            <option v-for="u in userList" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
        <button @click="applyFilters" class="btn-primary btn-sm">筛选</button>
        <button @click="resetFilters" class="btn-outline btn-sm">重置</button>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left">
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">用户</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">标题</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">科目</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">年级</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">状态</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">知识块</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">创建时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-muted">
            <tr v-for="doc in records" :key="doc.id" class="hover:bg-surface-secondary transition-colors">
              <td class="px-6 py-4 text-sm font-mono text-ink-secondary">{{ doc.id }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ userMap[doc.user_id] || `用户#${doc.user_id}` }}</td>
              <td class="px-6 py-4 text-sm text-ink font-medium max-w-48 truncate">{{ doc.title }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.subject || '-' }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.grade || '-' }}</td>
              <td class="px-6 py-4"><span :class="['tag', statusTag(doc.status)]">{{ statusLabel(doc.status) }}</span></td>
              <td class="px-6 py-4 text-sm text-ink">{{ doc.chunk }}</td>
              <td class="px-6 py-4 text-sm text-ink-muted">{{ doc.create_time?.slice(0, 16) || '-' }}</td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-ink-muted text-sm">{{ loading ? '加载中...' : '暂无知识文档' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="total > 0" class="flex items-center justify-between px-6 py-4 border-t border-surface-muted">
        <span class="text-sm text-ink-muted">共 {{ total }} 条</span>
        <div class="flex gap-1">
          <button @click="setPage(pageNum - 1)" :disabled="pageNum <= 1"
            class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 transition-all duration-150 text-sm disabled:opacity-40 disabled:cursor-not-allowed">&lt;</button>
          <button v-for="p in Math.min(totalPages, 5)" :key="p" @click="setPage(p)"
            class="cursor-pointer w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-150"
            :class="p === pageNum ? 'bg-brand-600 text-white' : 'border border-surface-muted text-ink-muted hover:border-brand-300 hover:text-brand-600'">{{ p }}</button>
          <button @click="setPage(pageNum + 1)" :disabled="pageNum >= totalPages"
            class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 transition-all duration-150 text-sm disabled:opacity-40 disabled:cursor-not-allowed">&gt;</button>
        </div>
      </div>
    </div>
  </div>
</template>