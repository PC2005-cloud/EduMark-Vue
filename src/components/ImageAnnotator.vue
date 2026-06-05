<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ImageInfo, QuestionResult } from '@/types/homework'

const props = defineProps<{
  images: ImageInfo[]
  questions: QuestionResult[]
  activeNo: string | null
}>()

const emit = defineEmits<{
  select: [no: string]
}>()

const currentIndex = ref(0)
const totalImages = computed(() => props.images.length)
const currentImage = computed(() => props.images[currentIndex.value])

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function next() {
  if (currentIndex.value < totalImages.value - 1) currentIndex.value++
}

const COLORS = [
  '#3B82F6', '#F59E0B', '#10B981', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

function getQuestionColor(index: number): string {
  return COLORS[index % COLORS.length]
}

function getBlockStyle(block: { x1: number; y1: number; x2: number; y2: number }, color: string, isActive: boolean) {
  const borderColor = isActive ? '#EF4444' : color
  return {
    left: `${block.x1 * 100}%`,
    top: `${block.y1 * 100}%`,
    width: `${(block.x2 - block.x1) * 100}%`,
    height: `${(block.y2 - block.y1) * 100}%`,
    backgroundColor: `${color}1A`,
    borderColor: borderColor,
    borderWidth: isActive ? '2.5px' : '1.5px',
    boxShadow: isActive ? '0 0 0 2px rgba(239,68,68,0.3)' : 'none',
    zIndex: isActive ? 10 : 1,
  }
}

// Group blocks by image URL
function getBlocksForImage(imageUrl: string, questions: QuestionResult[]) {
  const result: { no: string; color: string; blocks: QuestionResult['blocks'] }[] = []
  questions.forEach((q, idx) => {
    const relevantBlocks = q.blocks.filter(b => !b.url || b.url === imageUrl)
    if (relevantBlocks.length > 0) {
      result.push({ no: q.no, color: getQuestionColor(idx), blocks: relevantBlocks })
    }
  })
  return result
}

function handleBlockClick(no: string) {
  emit('select', no)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Image carousel -->
    <div class="relative w-full overflow-hidden rounded-xl bg-surface-secondary border border-surface-muted" v-if="currentImage">
      <div class="relative">
        <img
          :src="currentImage.url"
          :alt="`作业图片 ${currentIndex + 1}`"
          class="w-full h-auto block"
          loading="lazy"
          :key="currentImage.url"
        />
        <!-- Annotation overlays -->
        <div
          v-for="item in getBlocksForImage(currentImage.url, questions)"
          :key="item.no"
          class="absolute inset-0 pointer-events-none"
        >
          <div
            v-for="(block, bIdx) in item.blocks"
            :key="bIdx"
            :style="getBlockStyle(block, item.color, activeNo === item.no)"
            class="absolute rounded cursor-pointer pointer-events-auto transition-all duration-200 hover:brightness-110"
            :title="`第 ${item.no} 题`"
            @click.stop="handleBlockClick(item.no)"
          >
            <!-- Label badge -->
            <span
              :style="{ backgroundColor: item.color }"
              class="absolute -top-2 -left-0.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight whitespace-nowrap shadow-sm"
            >
              {{ item.no }}
            </span>
          </div>
        </div>
      </div>

      <!-- Prev button -->
      <button
        v-if="currentIndex > 0"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105"
        @click="prev"
      >
        <svg class="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Next button -->
      <button
        v-if="currentIndex < totalImages - 1"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105"
        @click="next"
      >
        <svg class="w-4 h-4 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Indicator / dots -->
    <div v-if="totalImages > 1" class="flex items-center justify-center gap-2">
      <button
        v-for="i in totalImages"
        :key="i"
        class="w-2 h-2 rounded-full transition-all duration-200"
        :class="currentIndex === i - 1 ? 'bg-brand-500 w-4' : 'bg-surface-border hover:bg-surface-strong'"
        @click="currentIndex = i - 1"
      />
      <span class="ml-3 text-xs text-ink-muted font-mono">{{ currentIndex + 1 }} / {{ totalImages }}</span>
    </div>
  </div>
</template>