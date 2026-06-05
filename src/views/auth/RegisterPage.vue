<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import type { RegisterForm } from '@/types/auth'

const router = useRouter()

const form = ref<RegisterForm>({
  account: '',
  username: '',
  password: '',
  email: '',
  role: 'student',
})
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  if (!form.value.account || !form.value.username || !form.value.password) {
    error.value = '请填写必填字段'
    return
  }
  if (form.value.password !== confirmPassword.value) {
    error.value = '两次密码输入不一致'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const payload = { ...form.value }
    if (!payload.email) delete payload.email
    await authApi.register(payload)
    // 注册成功跳转到登录页
    router.push('/login')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-teal-50 relative overflow-hidden">
    <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-brand-200/40 to-transparent blur-3xl"></div>
    <div class="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr from-teal-200/30 to-transparent blur-3xl"></div>
    <div class="relative z-10 w-full max-w-sm mx-4">
      <div class="card p-10 shadow-lg shadow-brand-100/20">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-md mb-4">
            <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path d="M12 14v7"/>
            </svg>
          </div>
          <h1 class="text-2xl font-heading font-bold text-brand-700 tracking-tight">注册账号</h1>
          <p class="text-ink-secondary text-sm mt-0.5">加入 EduMark 智能批改系统</p>
        </div>

        <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{{ error }}</div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">账号 <span class="text-red-500">*</span></label>
            <input v-model="form.account" type="text" placeholder="登录账号" class="glass-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">用户名 <span class="text-red-500">*</span></label>
            <input v-model="form.username" type="text" placeholder="显示名称" class="glass-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">密码 <span class="text-red-500">*</span></label>
            <input v-model="form.password" type="password" placeholder="密码" class="glass-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">确认密码 <span class="text-red-500">*</span></label>
            <input v-model="confirmPassword" type="password" placeholder="再次输入密码" class="glass-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">邮箱</label>
            <input v-model="form.email" type="email" placeholder="选填" class="glass-input" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">角色</label>
            <select v-model="form.role" class="glass-input">
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <button type="submit" class="btn-primary w-full justify-center py-3 text-base" :disabled="loading">
            {{ loading ? '注册中...' : '注 册' }}
          </button>
        </form>

        <p class="text-center mt-6 text-sm text-ink-muted">
          已有账号？<router-link to="/login" class="text-brand-600 font-semibold hover:text-brand-700 transition-colors">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>