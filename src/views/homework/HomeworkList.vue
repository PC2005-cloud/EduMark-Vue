<script setup lang="ts">
import { onMounted, computed, watch, triggerRef } from 'vue'
import { useRouter } from 'vue-router'
import { homeworkApi } from '@/api/homework'
import type { TaskOut } from '@/types/homework'
import { usePagination } from '@/composables'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const { records, total, pageNum, loading, load, setPage } = usePagination<TaskOut>((dto) =>
  homeworkApi.pageTask({ ...dto, sort_fields: [{ field: 'create_time', direction: 'desc' }] })
)

onMounted(() => load())

// After loading, fetch average scores for completed tasks
async function loadScores() {
  const completed = records.value.filter(t => t.status === 'completed' && t.average_score === undefined)
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
  // Force reactivity update since records is a shallowRef
  triggerRef(records)
}

watch(records, () => { loadScores() }, { immediate: true })

async function handleDelete(taskId: string) {
  if (!confirm('确定删除该作业吗？（同时删除批改结果）')) return
  try {
    await homeworkApi.delete(taskId)
    load()
  } catch {
    // silent
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 10)))

function statusTag(status: string) {
  const map: Record<string, string> = { completed: 'tag-success', processing: 'tag-processing', pending: 'tag-pending', failed: 'tag-failed' }
  return map[status] || 'tag-pending'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { completed: '已完成', processing: '处理中', pending: '待处理', failed: '失败' }
  return map[status] || status
}
function modeLabel(mode: string) {
  return mode === 'aliyun' ? '阿里云OCR' : '百炼视觉'
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div>
        <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">我的作业</h2>
        <p class="text-ink-secondary mt-1">管理作业提交与查看批改结果</p>
      </div>
      <button v-if="auth.isStudent" @click="router.push('/homework/submit')" class="btn-primary">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        提交作业
      </button>
    </div>

    <div class="card overflow-hidden">
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
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-muted">
            <tr v-for="task in records" :key="task.task_id" class="hover:bg-surface-secondary transition-colors">
              <td class="px-6 py-4 text-sm font-mono text-ink-secondary">{{ task.task_id.slice(0, 12) }}...</td>
              <td class="px-6 py-4 text-sm text-ink">{{ task.subject || '-' }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ task.grade || '-' }}</td>
              <td class="px-6 py-4 text-sm text-ink-muted">{{ modeLabel(task.mode) }}</td>
              <td class="px-6 py-4"><span :class="['tag', statusTag(task.status)]">{{ statusLabel(task.status) }}</span></td>
              <td class="px-6 py-4 text-sm">
                <span v-if="task.status === 'completed' && task.average_score !== undefined" class="font-semibold" :class="task.average_score >= 8 ? 'text-green-600' : task.average_score >= 5 ? 'text-amber-600' : 'text-red-600'">{{ task.average_score }}</span>
                <span v-else class="text-ink-muted">-</span>
              </td>
              <td class="px-6 py-4 text-sm text-ink-muted">{{ task.create_time?.slice(0, 16) || '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button v-if="task.status === 'completed'" @click="router.push(`/homework/result/${task.task_id}`)" class="btn-outline btn-sm">查看结果</button>
                  <button v-if="task.status !== 'processing'" @click="handleDelete(task.task_id)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-150 cursor-pointer border-none">删除</button>
                  <span v-else-if="task.status === 'processing'" class="text-sm text-ink-muted">处理中...</span>
                </div>
              </td>
            </tr>
            <tr v-if="records.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-ink-muted text-sm">{{ loading ? '加载中...' : '暂无作业记录' }}</td>
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