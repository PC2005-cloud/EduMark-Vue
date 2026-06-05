<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { homeworkApi } from '@/api/homework'
import { userApi } from '@/api/user'
import type { TaskOut, HomeworkResult } from '@/types/homework'
import * as echarts from 'echarts'

const auth = useAuthStore()

// ====== Data ======
const loading = ref(true)
const allTasks = ref<TaskOut[]>([])
const taskResults = ref<Map<string, HomeworkResult>>(new Map())

// For admin: student list & selected student
const studentList = ref<{ id: number; name: string }[]>([])
const selectedUserId = ref<number | undefined>(undefined)

// ====== Filtered data ======
const filteredTasks = computed(() => {
  let items = allTasks.value.filter(t => t.status === 'completed')
  if (auth.isStudent) {
    items = items.filter(t => t.user_id === auth.user?.id)
  } else if (auth.isAdmin && selectedUserId.value) {
    items = items.filter(t => t.user_id === selectedUserId.value)
  }
  return items.sort((a, b) => (a.create_time || '').localeCompare(b.create_time || ''))
})

interface TaskScoreEntry {
  taskId: string
  createTime: string
  subject: string
  grade: string
  avgScore: number
  totalScore: number
  questionCount: number
  correctCount: number
  wrongCount: number
  partialCount: number
}

const scoreEntries = computed<TaskScoreEntry[]>(() => {
  const entries: TaskScoreEntry[] = []
  for (const t of filteredTasks.value) {
    const result = taskResults.value.get(t.task_id)
    if (!result?.questions) continue
    let total = 0
    let correct = 0
    let wrong = 0
    let partial = 0
    for (const q of result.questions) {
      if (q.correction) {
        total += q.correction.score
        if (q.correction.result === 'correct') correct++
        else if (q.correction.result === 'wrong') wrong++
        else partial++
      }
    }
    const count = result.questions.filter(q => q.correction).length
    entries.push({
      taskId: t.task_id,
      createTime: t.create_time || '',
      subject: t.subject || '未知',
      grade: t.grade || '未知',
      avgScore: count > 0 ? total / count : 0,
      totalScore: total,
      questionCount: count,
      correctCount: correct,
      wrongCount: wrong,
      partialCount: partial,
    })
  }
  return entries
})

// ====== Stats ======
const totalTasks = computed(() => filteredTasks.value.length)
const totalQuestions = computed(() => scoreEntries.value.reduce((s, e) => s + e.questionCount, 0))
const overallAvgScore = computed(() => {
  if (scoreEntries.value.length === 0) return 0
  const total = scoreEntries.value.reduce((s, e) => s + e.totalScore, 0)
  const count = scoreEntries.value.reduce((s, e) => s + e.questionCount, 0)
  return count > 0 ? total / count : 0
})
const subjectList = computed(() => {
  const set = new Set(scoreEntries.value.map(e => e.subject))
  return [...set].sort()
})
const subjectAverages = computed(() => {
  const map = new Map<string, { total: number; count: number }>()
  for (const e of scoreEntries.value) {
    if (!map.has(e.subject)) map.set(e.subject, { total: 0, count: 0 })
    const v = map.get(e.subject)!
    v.total += e.totalScore
    v.count += e.questionCount
  }
  return [...map.entries()].map(([sub, v]) => ({
    subject: sub,
    avgScore: v.count > 0 ? v.total / v.count : 0,
  }))
})
const resultDistribution = computed(() => {
  let correct = 0
  let wrong = 0
  let partial = 0
  for (const e of scoreEntries.value) {
    correct += e.correctCount
    wrong += e.wrongCount
    partial += e.partialCount
  }
  return { correct, wrong, partial }
})

// For admin: student comparison
const studentAverages = computed(() => {
  if (!auth.isAdmin) return []
  const map = new Map<number, { name: string; total: number; count: number }>()
  for (const t of allTasks.value.filter(t => t.status === 'completed')) {
    if (!map.has(t.user_id)) {
      const u = studentList.value.find(s => s.id === t.user_id)
      map.set(t.user_id, { name: u?.name || `用户#${t.user_id}`, total: 0, count: 0 })
    }
    const result = taskResults.value.get(t.task_id)
    if (!result?.questions) continue
    for (const q of result.questions) {
      if (q.correction) {
        const v = map.get(t.user_id)!
        v.total += q.correction.score
        v.count++
      }
    }
  }
  return [...map.entries()]
    .map(([uid, v]) => ({ userId: uid, name: v.name, avgScore: v.count > 0 ? v.total / v.count : 0 }))
    .sort((a, b) => b.avgScore - a.avgScore)
})

// ====== Load data ======
async function loadAll() {
  loading.value = true
  try {
    const taskRes = await homeworkApi.pageTask({
      page_num: 1,
      page_size: 100,
      sort_fields: [{ field: 'create_time', direction: 'asc' }],
    })
    allTasks.value = taskRes.rows

    const completed = taskRes.rows.filter(t => t.status === 'completed')
    const results = new Map<string, HomeworkResult>()
    await Promise.all(completed.map(async (t) => {
      try {
        const r = await homeworkApi.getResult(t.task_id)
        results.set(t.task_id, r)
      } catch { /* skip */ }
    }))
    taskResults.value = results
  } catch { /* silent */ }
  finally { loading.value = false }
}

async function loadStudents() {
  if (!auth.isAdmin) return
  try {
    const res = await userApi.page({ page_num: 1, page_size: 100 })
    studentList.value = res.rows
      .filter(u => u.role === 'student')
      .map(u => ({ id: u.id, name: u.username }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  } catch { /* silent */ }
}

onMounted(() => {
  loadAll()
  loadStudents()
})

// ====== ECharts rendering ======
const trendRef = ref<HTMLElement>()
const subjectRef = ref<HTMLElement>()
const resultRef = ref<HTMLElement>()
const studentRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let subjectChart: echarts.ECharts | null = null
let resultChart: echarts.ECharts | null = null
let studentChart: echarts.ECharts | null = null

function initCharts() {
  if (trendRef.value) trendChart = echarts.init(trendRef.value)
  if (subjectRef.value) subjectChart = echarts.init(subjectRef.value)
  if (resultRef.value) resultChart = echarts.init(resultRef.value)
  if (studentRef.value && auth.isAdmin) studentChart = echarts.init(studentRef.value)
}

function renderCharts() {
  if (!trendChart || !subjectChart || !resultChart) return

  // Chart 1: Score trend
  const dates = scoreEntries.value.map(e => {
    const d = new Date(e.createTime)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const scores = scoreEntries.value.map(e => Math.round(e.avgScore * 10) / 10)
  trendChart.setOption({
    title: { text: '得分趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 50, bottom: 30 },
    xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 10, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'line',
      data: scores,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#6366f1', width: 2.5 },
      itemStyle: { color: '#6366f1' },
      areaStyle: { color: 'rgba(99, 102, 241, 0.1)' },
    }],
  })

  // Chart 2: Subject averages
  if (subjectAverages.value.length > 0) {
    const subs = subjectAverages.value.map(s => s.subject)
    const avgs = subjectAverages.value.map(s => Math.round(s.avgScore * 10) / 10)
    subjectChart.setOption({
      title: { text: '各科平均分', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 50, bottom: 30 },
      xAxis: { type: 'category', data: subs, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: 10, axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar',
        data: avgs,
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a78bfa' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      }],
    })
  } else {
    subjectChart.clear()
  }

  // Chart 3: Result distribution
  const { correct, wrong, partial } = resultDistribution.value
  const total = correct + wrong + partial
  if (total > 0) {
    resultChart.setOption({
      title: { text: '题目结果分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} 题 ({d}%)' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '55%'],
        avoidLabelOverlap: true,
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
        emphasis: { label: { show: true, fontSize: 13 }, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
        data: [
          { value: correct, name: '正确', itemStyle: { color: '#22c55e' } },
          { value: wrong, name: '错误', itemStyle: { color: '#ef4444' } },
          { value: partial, name: '部分正确', itemStyle: { color: '#f59e0b' } },
        ],
      }],
    })
  } else {
    resultChart.clear()
    resultChart.setOption({
      title: { text: '题目结果分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
    })
  }

  // Chart 4 (Admin): Student comparison
  if (auth.isAdmin && studentChart) {
    if (studentAverages.value.length > 0) {
      const names = studentAverages.value.map(s => s.name)
      const avgs = studentAverages.value.map(s => Math.round(s.avgScore * 10) / 10)
      studentChart.setOption({
        title: { text: '学生平均分对比', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 50, bottom: 50 },
        xAxis: { type: 'category', data: names, axisLabel: { fontSize: 10, rotate: 30 } },
        yAxis: { type: 'value', min: 0, max: 10, axisLabel: { fontSize: 11 } },
        series: [{
          type: 'bar',
          data: avgs.map(v => ({
            value: v,
            itemStyle: { color: v >= 8 ? '#22c55e' : v >= 5 ? '#f59e0b' : '#ef4444' },
          })),
          barWidth: '50%',
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        }],
      })
    } else {
      studentChart.clear()
      studentChart.setOption({
        title: { text: '学生平均分对比', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
      })
    }
  }
}

function handleResize() {
  trendChart?.resize()
  subjectChart?.resize()
  resultChart?.resize()
  studentChart?.resize()
}

onMounted(() => {
  loadAll()
  loadStudents()
  window.addEventListener('resize', handleResize)
})

// Watch loading → init charts when DOM is ready
watch(loading, (val) => {
  if (!val) {
    nextTick(() => {
      initCharts()
      renderCharts()
    })
  }
})

// Watch data changes → re-render charts
watch(scoreEntries, () => {
  nextTick(renderCharts)
}, { deep: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  subjectChart?.dispose()
  resultChart?.dispose()
  studentChart?.dispose()
})

function selectStudent() {
  // trigger re-render via computed reactivity
}

function formatAvg(n: number): string {
  return n.toFixed(1)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-heading font-bold text-ink">统计分析</h1>
      <div v-if="auth.isAdmin" class="flex items-center gap-3">
        <label class="text-sm text-ink-muted">按学生筛选：</label>
        <select
          v-model="selectedUserId"
          @change="selectStudent"
          class="form-select text-sm px-3 py-1.5 rounded-lg border border-surface-muted bg-surface text-ink"
        >
          <option :value="undefined">全部学生</option>
          <option v-for="s in studentList" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-5">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">已完成作业</p>
          <p class="text-2xl font-heading font-bold text-ink mt-1">{{ totalTasks }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">平均分</p>
          <p class="text-2xl font-heading font-bold text-ink mt-1">{{ formatAvg(overallAvgScore) }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">总题数</p>
          <p class="text-2xl font-heading font-bold text-ink mt-1">{{ totalQuestions }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs font-semibold text-ink-muted uppercase tracking-wider">涉及科目</p>
          <p class="text-2xl font-heading font-bold text-ink mt-1">{{ subjectList.length }}</p>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="card p-4">
          <div ref="trendRef" class="w-full" style="height: 300px;"></div>
        </div>
        <div class="card p-4">
          <div ref="subjectRef" class="w-full" style="height: 300px;"></div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="card p-4">
          <div ref="resultRef" class="w-full" style="height: 300px;"></div>
        </div>
        <div v-if="auth.isAdmin" class="card p-4">
          <div ref="studentRef" class="w-full" style="height: 300px;"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="totalTasks === 0 && !loading" class="text-center py-16">
        <svg class="w-16 h-16 mx-auto text-surface-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <p class="text-ink-muted text-sm">暂无统计数据</p>
        <p class="text-ink-muted text-xs mt-1">完成作业批改后即可查看分析图表</p>
      </div>
    </template>
  </div>
</template>