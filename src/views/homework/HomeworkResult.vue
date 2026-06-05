<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { homeworkApi } from '@/api/homework'
import type { HomeworkResult } from '@/types/homework'
import { usePolling } from '@/composables'
import ImageAnnotator from '@/components/ImageAnnotator.vue'
import { markDownIt } from '@/utils/tools'

function renderText(text: string | null): string {
  if (!text) return ''
  return markDownIt.render(text)
}

const route = useRoute()
const router = useRouter()
const taskId = route.params.taskId as string

const result = ref<HomeworkResult | null>(null)
const loading = ref(true)
const error = ref('')
const activeQuestionNo = ref<string | null>(null)

async function fetchResult() {
  try {
    result.value = await homeworkApi.getResult(taskId)
    loading.value = false
    if (result.value.status === 'completed' || result.value.status === 'failed') {
      polling.stop()
    }
  } catch (e: any) {
    if (!result.value) {
      error.value = e.message || '加载失败'
    }
    loading.value = false
  }
}

const polling = usePolling(fetchResult, 3000)

onMounted(() => {
  fetchResult()
})

const totalScore = ref(0)
const questionCount = ref(0)

const expandedKnowledgeRefs = ref<string[]>([])

watch(result, (val) => {
  if (val?.questions) {
    questionCount.value = val.questions.length
    totalScore.value = val.questions.reduce((sum, q) => sum + (q.correction?.score || 0), 0)
    expandedKnowledgeRefs.value = []
  }
})

function resultTag(resultType: string) {
  const map: Record<string, string> = { correct: 'tag-success', wrong: 'tag-failed', partial: 'tag-pending' }
  return map[resultType] || 'tag-pending'
}
function resultLabel(resultType: string) {
  const map: Record<string, string> = { correct: '正确', wrong: '错误', partial: '部分正确' }
  return map[resultType] || resultType
}
function modeLabel(mode: string) {
  return mode === 'aliyun' ? '阿里云OCR' : '百炼视觉'
}

function onBlockSelect(no: string) {
  activeQuestionNo.value = no
  nextTick(() => {
    const el = document.getElementById(`q-${no}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

function toggleKnowledgeRefs(no: string) {
  if (expandedKnowledgeRefs.value.includes(no)) {
    expandedKnowledgeRefs.value = expandedKnowledgeRefs.value.filter(n => n !== no)
  } else {
    expandedKnowledgeRefs.value = [...expandedKnowledgeRefs.value, no]
  }
}
</script>

<template>
  <div class="animate-slide-up">
    <!-- 加载状态 -->
    <div v-if="loading && !result" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-4"></div>
        <p class="text-ink-muted text-sm">正在加载批改结果...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-20">
      <p class="text-red-600">{{ error }}</p>
      <button @click="router.push('/homework')" class="btn-outline mt-4">返回作业列表</button>
    </div>

    <!-- 结果内容 -->
    <template v-else-if="result">
      <div class="mb-8">
        <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">批改结果</h2>
        <p class="text-ink-secondary mt-1 font-mono text-sm">任务 {{ result.task_id.slice(0, 8) }}... · {{ result.subject || '-' }} · {{ result.grade || '-' }}</p>
      </div>

      <!-- 处理中提示 -->
      <div v-if="result.status === 'processing'" class="card p-6 mb-6 flex items-center gap-4">
        <span class="w-3 h-3 rounded-full bg-brand-500 animate-pulse-dot"></span>
        <span class="text-ink-secondary text-sm">AI 正在批改中，请稍候...</span>
      </div>

      <!-- 图片标注区 -->
      <div v-if="result.images && result.images.length > 0" class="card p-4 lg:p-6 mb-6">
        <h3 class="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-4">作业原图标注</h3>
        <ImageAnnotator
          :images="result.images"
          :questions="result.questions"
          :active-no="activeQuestionNo"
          @select="onBlockSelect"
        />
      </div>

      <div class="card overflow-hidden">
        <!-- Summary -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 lg:p-8 border-b border-surface-muted">
          <div class="w-24 h-24 rounded-full bg-green-50 border-2 border-green-200 flex flex-col items-center justify-center shrink-0">
            <span class="text-3xl font-heading font-bold text-green-700">{{ result.status === 'completed' ? (questionCount > 0 ? (totalScore / questionCount).toFixed(1) : '-') : '-' }}</span>
            <span class="text-xs text-green-500">平均分 / 10</span>
          </div>
          <div>
            <h3 class="text-lg font-heading font-semibold text-ink">{{ result.subject || '' }}作业批改报告</h3>
            <div class="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-sm text-ink-muted">
              <span>科目：{{ result.subject || '-' }}</span>
              <span>年级：{{ result.grade || '-' }}</span>
              <span>识别模式：{{ modeLabel(result.mode || '') }}</span>
              <span>提交时间：{{ result.create_time?.slice(0, 16) || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Questions -->
        <div v-if="result.questions && result.questions.length > 0" class="divide-y divide-surface-muted">
          <div
            v-for="q in result.questions"
            :id="`q-${q.no}`"
            :key="q.no"
            class="p-6 transition-colors cursor-pointer"
            :class="[
              activeQuestionNo === q.no ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-surface-secondary'
            ]"
            @click="onBlockSelect(q.no)"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="font-heading font-bold text-ink text-lg">第 {{ q.no }} 题</span>
              <div v-if="q.correction" class="flex items-center gap-3">
                <span class="w-9 h-9 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center font-heading font-bold text-green-700 text-sm">{{ q.correction.score }}</span>
                <span :class="['tag', resultTag(q.correction.result)]">{{ resultLabel(q.correction.result) }}</span>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div>
                <p class="text-xs font-semibold text-ink-muted uppercase mb-1">题目内容</p>
                <p class="text-sm text-ink bg-surface-secondary rounded-lg p-3" v-html="renderText(q.question_text)"></p>
              </div>
              <div>
                <p class="text-xs font-semibold text-ink-muted uppercase mb-1">学生答案</p>
                <p class="text-sm text-ink bg-surface-secondary rounded-lg p-3" v-html="renderText(q.student_answer)"></p>
              </div>
            </div>
            <div v-if="q.correction?.comment" class="mb-3">
              <p class="text-xs font-semibold text-ink-muted uppercase mb-1">评语</p>
              <p class="text-sm text-amber-800 bg-amber-50 rounded-lg p-3 border-l-2 border-amber-400" v-html="renderText(q.correction.comment)"></p>
            </div>
            <div v-if="q.correction?.analysis" class="mb-3">
              <p class="text-xs font-semibold text-ink-muted uppercase mb-1">解题分析</p>
              <p class="text-sm text-teal-800 bg-teal-50 rounded-lg p-3 border-l-2 border-teal-400" v-html="renderText(q.correction.analysis)"></p>
            </div>
            <!-- Knowledge refs -->
            <div v-if="q.knowledge_refs && q.knowledge_refs.length > 0">
              <div
                class="flex items-center gap-1.5 cursor-pointer select-none mb-1"
                @click.stop="toggleKnowledgeRefs(q.no)"
              >
                <p class="text-xs font-semibold text-ink-muted uppercase tracking-wide">知识引用</p>
                <svg
                  class="w-3.5 h-3.5 text-ink-muted transition-transform duration-200"
                  :class="expandedKnowledgeRefs.includes(q.no) ? 'rotate-180' : ''"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <Transition name="collapse">
                <div v-if="expandedKnowledgeRefs.includes(q.no)">
                  <div v-for="ref in q.knowledge_refs" :key="ref.knowledge_id" class="text-sm text-teal-800 bg-teal-50 rounded-lg p-3 border-l-2 border-teal-400 mb-1">
                    <span v-html="renderText(ref.title)"></span> · <span v-html="renderText(ref.content)"></span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="result.status === 'completed'" class="p-10 text-center text-ink-muted text-sm">
          暂无题目识别结果
        </div>
      </div>

      <div class="mt-4">
        <button @click="router.push('/homework')" class="btn-outline">返回作业列表</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
