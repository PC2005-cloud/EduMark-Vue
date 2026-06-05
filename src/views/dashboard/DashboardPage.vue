<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { homeworkApi } from '@/api/homework'
import { knowledgeApi } from '@/api/knowledge'
import type { TaskOut } from '@/types/homework'
import type { KnowledgeOut } from '@/types/knowledge'

const auth = useAuthStore()
const router = useRouter()

// Student homework stats
const studentStats = ref({ total: 0, completed: 0, processing: 0, pending: 0 })
const recentTasks = ref<TaskOut[]>([])

// Teacher/Admin knowledge stats
const knowledgeStats = ref({ total: 0, completed: 0, parsing: 0, totalChunks: 0 })
const recentDocs = ref<KnowledgeOut[]>([])

onMounted(async () => {
  const needHomework = auth.isStudent || auth.isAdmin
  const needKnowledge = !auth.isStudent

  if (needHomework) {
    try {
      const res = await homeworkApi.pageTask({ page_num: 1, page_size: 5, sort_fields: [{ field: 'create_time', direction: 'desc' }] })
      recentTasks.value = res.rows
      studentStats.value.total = res.total
      studentStats.value.completed = res.rows.filter(t => t.status === 'completed').length
      studentStats.value.processing = res.rows.filter(t => t.status === 'processing').length
      studentStats.value.pending = res.rows.filter(t => t.status === 'pending').length
    } catch {
      // silent
    }
  }

  if (needKnowledge) {
    try {
      const res = await knowledgeApi.page({ page_num: 1, page_size: 100, sort_fields: [{ field: 'create_time', direction: 'desc' }] })
      const docs = res.rows
      recentDocs.value = docs.slice(0, 5)
      knowledgeStats.value.total = docs.length
      knowledgeStats.value.completed = docs.filter(d => d.status === 'completed').length
      knowledgeStats.value.parsing = docs.filter(d => d.status === 'parsing' || d.status === 'pending').length
      knowledgeStats.value.totalChunks = docs.reduce((sum, d) => sum + (d.chunk || 0), 0)
    } catch {
      // silent
    }
  }
})

// Load average scores for completed tasks
async function loadScores() {
  const completed = recentTasks.value.filter(t => t.status === 'completed' && t.average_score === undefined)
  if (completed.length === 0) return
  const results = await Promise.allSettled(completed.map(t => homeworkApi.getResult(t.task_id)))
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const questions = r.value.questions
      const scores = questions.map(q => q.correction?.score).filter((s): s is number => s !== undefined && s !== null)
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        completed[i].average_score = Math.round(avg * 10) / 10
      }
    }
  })
}

watch(recentTasks, () => { loadScores() }, { immediate: true })

function statusTag(status: string) {
  const map: Record<string, string> = { completed: 'tag-success', processing: 'tag-processing', parsing: 'tag-processing', pending: 'tag-pending', failed: 'tag-failed' }
  return map[status] || 'tag-pending'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { completed: '已完成', processing: '处理中', parsing: '解析中', pending: '待处理', failed: '失败' }
  return map[status] || status
}
function modeLabel(mode: string) {
  return mode === 'aliyun' ? '阿里云OCR' : '百炼视觉'
}
function truncateId(id: string) {
  return id.length > 12 ? id.slice(0, 8) + '...' : id
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="mb-8">
      <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">工作台</h2>
      <p class="text-ink-secondary mt-1">欢迎回来，{{ auth.username }}</p>
    </div>

    <!-- Student: Homework stats -->
    <template v-if="auth.isStudent">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.total }}</p>
          <p class="text-xs text-ink-muted mt-0.5">提交作业总数</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.completed }}</p>
          <p class="text-xs text-ink-muted mt-0.5">已完成批改</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.processing }}</p>
          <p class="text-xs text-ink-muted mt-0.5">批改进行中</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.pending }}</p>
          <p class="text-xs text-ink-muted mt-0.5">待处理</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
          <h3 class="text-base font-heading font-semibold text-ink">最近批改任务</h3>
          <button @click="router.push('/homework')" class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer">查看全部</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left">
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">任务ID</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">科目</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">年级</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">识别模式</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">平均分</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">提交时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-muted">
              <tr v-for="task in recentTasks" :key="task.task_id" @click="router.push(`/homework/result/${task.task_id}`)" class="hover:bg-surface-secondary transition-colors cursor-pointer">
                <td class="px-6 py-4 text-sm font-mono text-ink-secondary">{{ truncateId(task.task_id) }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ task.subject || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ task.grade || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ modeLabel(task.mode) }}</td>
                <td class="px-6 py-4"><span :class="['tag', statusTag(task.status)]">{{ statusLabel(task.status) }}</span></td>
                <td class="px-6 py-4 text-sm">
                  <span v-if="task.status === 'completed' && task.average_score !== undefined" class="font-semibold" :class="task.average_score >= 8 ? 'text-green-600' : task.average_score >= 5 ? 'text-amber-600' : 'text-red-600'">{{ task.average_score }}</span>
                  <span v-else class="text-ink-muted">-</span>
                </td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ task.create_time?.slice(0, 16) || '-' }}</td>
              </tr>
              <tr v-if="recentTasks.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-ink-muted text-sm">暂无任务</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Teacher: Knowledge stats only -->
    <template v-else-if="auth.isTeacher">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.total }}</p>
          <p class="text-xs text-ink-muted mt-0.5">知识文档总数</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.completed }}</p>
          <p class="text-xs text-ink-muted mt-0.5">已完成解析</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.parsing }}</p>
          <p class="text-xs text-ink-muted mt-0.5">解析进行中</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.totalChunks }}</p>
          <p class="text-xs text-ink-muted mt-0.5">知识块总数</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
          <h3 class="text-base font-heading font-semibold text-ink">最近上传文档</h3>
          <button @click="router.push('/knowledge')" class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer">查看全部</button>
        </div>
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
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-muted">
              <tr v-for="doc in recentDocs" :key="doc.id" @click="router.push('/knowledge')" class="hover:bg-surface-secondary transition-colors cursor-pointer">
                <td class="px-6 py-4 text-sm font-medium text-ink max-w-48 truncate">{{ doc.title }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.subject || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.grade || '-' }}</td>
                <td class="px-6 py-4"><span :class="['tag', statusTag(doc.status)]">{{ statusLabel(doc.status) }}</span></td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.status === 'completed' ? doc.chunk : '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ doc.create_time?.slice(0, 16) || '-' }}</td>
              </tr>
              <tr v-if="recentDocs.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-ink-muted text-sm">暂无知识文档</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Admin: All stats -->
    <template v-else>
      <!-- Section: Homework stats -->
      <h3 class="text-lg font-heading font-semibold text-ink mb-4">作业批改统计</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.total }}</p>
          <p class="text-xs text-ink-muted mt-0.5">提交作业总数</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.completed }}</p>
          <p class="text-xs text-ink-muted mt-0.5">已完成批改</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.processing }}</p>
          <p class="text-xs text-ink-muted mt-0.5">批改进行中</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ studentStats.pending }}</p>
          <p class="text-xs text-ink-muted mt-0.5">待处理</p>
        </div>
      </div>

      <div class="card overflow-hidden mb-8">
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
          <h3 class="text-base font-heading font-semibold text-ink">最近批改任务</h3>
          <button @click="router.push('/homework')" class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer">查看全部</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left">
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">任务ID</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">科目</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">年级</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">识别模式</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">状态</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">平均分</th>
                <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">提交时间</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-muted">
              <tr v-for="task in recentTasks" :key="task.task_id" @click="router.push(`/homework/result/${task.task_id}`)" class="hover:bg-surface-secondary transition-colors cursor-pointer">
                <td class="px-6 py-4 text-sm font-mono text-ink-secondary">{{ truncateId(task.task_id) }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ task.subject || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ task.grade || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ modeLabel(task.mode) }}</td>
                <td class="px-6 py-4"><span :class="['tag', statusTag(task.status)]">{{ statusLabel(task.status) }}</span></td>
                <td class="px-6 py-4 text-sm">
                  <span v-if="task.status === 'completed' && task.average_score !== undefined" class="font-semibold" :class="task.average_score >= 8 ? 'text-green-600' : task.average_score >= 5 ? 'text-amber-600' : 'text-red-600'">{{ task.average_score }}</span>
                  <span v-else class="text-ink-muted">-</span>
                </td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ task.create_time?.slice(0, 16) || '-' }}</td>
              </tr>
              <tr v-if="recentTasks.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-ink-muted text-sm">暂无任务</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: Knowledge stats -->
      <h3 class="text-lg font-heading font-semibold text-ink mb-4">知识库统计</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-8">
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.total }}</p>
          <p class="text-xs text-ink-muted mt-0.5">知识文档总数</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.completed }}</p>
          <p class="text-xs text-ink-muted mt-0.5">已完成解析</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.parsing }}</p>
          <p class="text-xs text-ink-muted mt-0.5">解析进行中</p>
        </div>
        <div class="card p-5 lg:p-6">
          <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p class="text-2xl font-heading font-bold text-ink">{{ knowledgeStats.totalChunks }}</p>
          <p class="text-xs text-ink-muted mt-0.5">知识块总数</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
          <h3 class="text-base font-heading font-semibold text-ink">最近上传文档</h3>
          <button @click="router.push('/knowledge')" class="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer">查看全部</button>
        </div>
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
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-muted">
              <tr v-for="doc in recentDocs" :key="doc.id" @click="router.push('/knowledge')" class="hover:bg-surface-secondary transition-colors cursor-pointer">
                <td class="px-6 py-4 text-sm font-medium text-ink max-w-48 truncate">{{ doc.title }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.subject || '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.grade || '-' }}</td>
                <td class="px-6 py-4"><span :class="['tag', statusTag(doc.status)]">{{ statusLabel(doc.status) }}</span></td>
                <td class="px-6 py-4 text-sm text-ink">{{ doc.status === 'completed' ? doc.chunk : '-' }}</td>
                <td class="px-6 py-4 text-sm text-ink-muted">{{ doc.create_time?.slice(0, 16) || '-' }}</td>
              </tr>
              <tr v-if="recentDocs.length === 0">
                <td colspan="6" class="px-6 py-12 text-center text-ink-muted text-sm">暂无知识文档</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>