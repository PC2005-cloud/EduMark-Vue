<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { configApi } from '@/api/config'
import { modelApi } from '@/api/model'
import type { ConfigOut, ConfigUpdate } from '@/types/config'
import type { ModelOut } from '@/types/model'

const config = ref<ConfigOut | null>(null)
const vlModels = ref<ModelOut[]>([])
const glModels = ref<ModelOut[]>([])
const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')

const form = ref<ConfigUpdate>({})

onMounted(async () => {
  try {
    const [cfg, modelRes] = await Promise.all([
      configApi.getMyConfig(),
      modelApi.page({ page_num: 1, page_size: 100 }),
    ])
    config.value = cfg
    vlModels.value = modelRes.rows.filter(m => m.mode === 1)
    glModels.value = modelRes.rows.filter(m => m.mode === 2)
    form.value = {
      rec_mode: cfg.rec_mode,
      enable_enhance: cfg.enable_enhance,
      enable_knowledge: cfg.enable_knowledge,
      vl_model: cfg.vl_model || undefined,
      gl_model: cfg.gl_model || undefined,
    }
  } catch {
    // silent
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  saving.value = true
  successMsg.value = ''
  try {
    const updated = await configApi.updateMyConfig(form.value)
    config.value = updated
    successMsg.value = '配置保存成功'
    setTimeout(() => successMsg.value = '', 3000)
  } catch {
    // silent
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="mb-8">
      <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">个人设置</h2>
      <p class="text-ink-secondary mt-1">配置识别模式与 AI 模型偏好</p>
    </div>

    <div v-if="successMsg" class="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">{{ successMsg }}</div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="px-6 py-4 border-b border-surface-muted">
        <h3 class="text-base font-heading font-semibold text-ink">识别配置</h3>
      </div>
      <div class="p-6 lg:p-8 space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-semibold text-ink mb-1.5">识别模式</label>
            <select v-model="form.rec_mode" class="glass-input">
              <option value="aliyun">阿里云 OCR（切题识别）</option>
              <option value="bailian">百炼视觉（端到端理解）</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1.5">视觉模型</label>
            <select v-model="form.vl_model" class="glass-input">
              <option :value="undefined">无</option>
              <option v-for="m in vlModels" :key="m.id" :value="m.name">{{ m.name }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-semibold text-ink mb-1.5">批改模型</label>
            <select v-model="form.gl_model" class="glass-input">
              <option :value="undefined">无</option>
              <option v-for="m in glModels" :key="m.id" :value="m.name">{{ m.name }}</option>
            </select>
          </div>
          <div></div>
        </div>

        <!-- Toggles -->
        <div class="space-y-3 pt-1">
          <label class="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary border border-surface-muted cursor-pointer hover:bg-brand-50/50 transition-all duration-200">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-ink text-sm">图像增强</p>
              <p class="text-xs text-ink-muted mt-0.5">提交作业时自动增强图片对比度与锐度，提升识别准确率</p>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: form.enable_enhance }"
              @click="form.enable_enhance = !form.enable_enhance"
            >
              <span class="toggle-knob"></span>
            </div>
          </label>
          <label class="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary border border-surface-muted cursor-pointer hover:bg-brand-50/50 transition-all duration-200">
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-ink text-sm">知识库检索</p>
              <p class="text-xs text-ink-muted mt-0.5">批改时自动检索知识库，提供更精准的评语和分析</p>
            </div>
            <div
              class="toggle-switch"
              :class="{ active: form.enable_knowledge }"
              @click="form.enable_knowledge = !form.enable_knowledge"
            >
              <span class="toggle-knob"></span>
            </div>
          </label>
        </div>

        <button @click="handleSave" class="btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存配置' }}
        </button>
      </div>
    </div>
  </div>
</template>