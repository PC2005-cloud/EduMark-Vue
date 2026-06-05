<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { userApi } from '@/api/user'
import { modelApi } from '@/api/model'
import { homeworkApi } from '@/api/homework'
import type { UserOut, UserCreate } from '@/types/user'
import type { ModelOut, ModelCreate } from '@/types/model'
import { usePagination } from '@/composables'

// ====== Stats ======
const taskTotal = ref(0)
onMounted(async () => {
  loadUsers()
  loadModels()
  try {
    const res = await homeworkApi.pageTask({ page_num: 1, page_size: 1 })
    taskTotal.value = res.total
  } catch { /* silent */ }
})

// ====== User Management ======
const {
  records: userRecords, total: userTotal, pageNum: userPageNum,
  loading: userLoading, load: loadUsers, setPage: setUserPage,
} = usePagination<UserOut>((dto) => userApi.page({ ...dto, sort_fields: [{ field: 'create_time', direction: 'desc' }] }))

const showUserModal = ref(false)
const editingUser = ref<UserOut | null>(null)
const userForm = ref<UserCreate & { email: string }>({ account: '', username: '', password: '', email: '', role: 'student' })
const userSaving = ref(false)
const userError = ref('')

const isEditingUser = computed(() => !!editingUser.value)

function openCreateUser() {
  editingUser.value = null
  userForm.value = { account: '', username: '', password: '', email: '', role: 'student' }
  userError.value = ''
  showUserModal.value = true
}

function openEditUser(u: UserOut) {
  editingUser.value = u
  userForm.value = { account: u.account, username: u.username, password: '', email: u.email || '', role: u.role === 'admin' ? 'teacher' : u.role }
  userError.value = ''
  showUserModal.value = true
}

async function handleCreateUser() {
  if (!userForm.value.account || !userForm.value.username) return
  if (!isEditingUser.value && !userForm.value.password) return
  userSaving.value = true
  userError.value = ''
  try {
    if (isEditingUser.value && editingUser.value) {
      const payload: Record<string, any> = { username: userForm.value.username, email: userForm.value.email || undefined }
      if (userForm.value.password) payload.password = userForm.value.password
      await userApi.update(editingUser.value.id, payload)
    } else {
      await userApi.create({ ...userForm.value })
    }
    showUserModal.value = false
    loadUsers()
  } catch (e: any) {
    userError.value = e.message || (isEditingUser.value ? '修改失败' : '创建失败')
  } finally {
    userSaving.value = false
  }
}

async function handleDeleteUser(id: number) {
  if (!confirm('确定删除该用户吗？（会级联删除其所有数据）')) return
  try {
    await userApi.delete(id)
    loadUsers()
  } catch {
    // silent
  }
}

const totalUserPages = computed(() => Math.max(1, Math.ceil(userTotal.value / 10)))

function roleTag(role: string) {
  const map: Record<string, string> = { admin: 'tag-admin', teacher: 'tag-teacher', student: 'tag-student' }
  return map[role] || ''
}
function roleLabel(role: string) {
  const map: Record<string, string> = { admin: '管理员', teacher: '教师', student: '学生' }
  return map[role] || role
}

// ====== Model Management ======
const {
  records: modelRecords, total: modelTotal,
  loading: modelLoading, load: loadModels,
} = usePagination<ModelOut>((dto) => modelApi.page({ ...dto }))

const showModelModal = ref(false)
const editingModel = ref<ModelOut | null>(null)
const modelForm = ref<ModelCreate>({ name: '', mode: 1 })
const modelSaving = ref(false)
const modelError = ref('')

const isEditingModel = computed(() => !!editingModel.value)

function openCreateModel() {
  editingModel.value = null
  modelForm.value = { name: '', mode: 1 }
  modelError.value = ''
  showModelModal.value = true
}

function openEditModel(m: ModelOut) {
  editingModel.value = m
  modelForm.value = { name: m.name, mode: m.mode }
  modelError.value = ''
  showModelModal.value = true
}

async function handleCreateModel() {
  if (!modelForm.value.name) return
  modelSaving.value = true
  modelError.value = ''
  try {
    if (isEditingModel.value && editingModel.value) {
      await modelApi.update(editingModel.value.id, modelForm.value)
    } else {
      await modelApi.create(modelForm.value)
    }
    showModelModal.value = false
    loadModels()
  } catch (e: any) {
    modelError.value = e.message || (isEditingModel.value ? '修改失败' : '创建失败')
  } finally {
    modelSaving.value = false
  }
}

async function handleDeleteModel(id: number) {
  if (!confirm('确定删除该模型吗？')) return
  try {
    await modelApi.delete(id)
    loadModels()
  } catch {
    // silent
  }
}

function modelModeLabel(mode: number) {
  return mode === 1 ? '视觉模型' : '语言模型'
}
function modelModeTag(mode: number) {
  return mode === 1 ? 'tag-vl' : 'tag-llm'
}
</script>

<template>
  <div class="animate-slide-up">
    <div class="mb-8">
      <h2 class="text-2xl lg:text-3xl font-heading font-bold text-ink tracking-tight">管理后台</h2>
      <p class="text-ink-secondary mt-1">系统用户与模型管理</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 lg:gap-5 mb-8">
      <div class="card p-5">
        <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <p class="text-2xl font-heading font-bold text-ink">{{ userTotal }}</p>
        <p class="text-xs text-ink-muted">用户总数</p>
      </div>
      <div class="card p-5">
        <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <p class="text-2xl font-heading font-bold text-ink">{{ modelTotal }}</p>
        <p class="text-xs text-ink-muted">AI 模型数</p>
      </div>
      <div class="card p-5">
        <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
          <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
        </div>
        <p class="text-2xl font-heading font-bold text-ink">{{ taskTotal }}</p>
        <p class="text-xs text-ink-muted">作业任务总数</p>
      </div>
    </div>

    <!-- User Management -->
    <div class="card overflow-hidden mb-6">
      <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
        <h3 class="text-base font-heading font-semibold text-ink">用户管理</h3>
        <button @click="openCreateUser" class="btn-primary btn-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增用户
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left">
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">ID</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">账号</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">用户名</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">角色</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">状态</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">创建时间</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-muted">
            <tr v-for="u in userRecords" :key="u.id" class="hover:bg-surface-secondary transition-colors">
              <td class="px-6 py-4 text-sm text-ink">{{ u.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-ink">{{ u.account }}</td>
              <td class="px-6 py-4 text-sm text-ink">{{ u.username }}</td>
              <td class="px-6 py-4"><span :class="['tag', roleTag(u.role)]">{{ roleLabel(u.role) }}</span></td>
              <td class="px-6 py-4"><span :class="['tag', u.is_active ? 'tag-success' : 'tag-failed']">{{ u.is_active ? '启用' : '禁用' }}</span></td>
              <td class="px-6 py-4 text-sm text-ink-muted">{{ u.create_time?.slice(0, 10) || '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button @click="openEditUser(u)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all duration-150 cursor-pointer border-none">编辑</button>
                  <button @click="handleDeleteUser(u.id)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-150 cursor-pointer border-none">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="userRecords.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-ink-muted text-sm">{{ userLoading ? '加载中...' : '暂无用户' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="userTotal > 0" class="flex items-center justify-between px-6 py-4 border-t border-surface-muted">
        <span class="text-sm text-ink-muted">共 {{ userTotal }} 条</span>
        <div class="flex gap-1">
          <button @click="setUserPage(userPageNum - 1)" :disabled="userPageNum <= 1" class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 text-sm disabled:opacity-40">&lt;</button>
          <button v-for="p in Math.min(totalUserPages, 5)" :key="p" @click="setUserPage(p)" class="cursor-pointer w-8 h-8 rounded-lg text-sm font-semibold" :class="p === userPageNum ? 'bg-brand-600 text-white' : 'border border-surface-muted text-ink-muted hover:border-brand-300 hover:text-brand-600'">{{ p }}</button>
          <button @click="setUserPage(userPageNum + 1)" :disabled="userPageNum >= totalUserPages" class="cursor-pointer w-8 h-8 rounded-lg border border-surface-muted flex items-center justify-center text-ink-muted hover:border-brand-300 hover:text-brand-600 text-sm disabled:opacity-40">&gt;</button>
        </div>
      </div>
    </div>

    <!-- Model Management -->
    <div class="card overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-surface-muted">
        <h3 class="text-base font-heading font-semibold text-ink">模型管理</h3>
        <button @click="openCreateModel" class="btn-primary btn-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增模型
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left">
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">ID</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">模型名称</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">类型</th>
              <th class="px-6 py-3 text-[11px] font-semibold text-ink-muted uppercase">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-muted">
            <tr v-for="m in modelRecords" :key="m.id" class="hover:bg-surface-secondary transition-colors">
              <td class="px-6 py-4 text-sm text-ink">{{ m.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-ink">{{ m.name }}</td>
              <td class="px-6 py-4"><span :class="['tag', modelModeTag(m.mode)]">{{ modelModeLabel(m.mode) }}</span></td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button @click="openEditModel(m)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-brand-50 text-brand-600 hover:bg-brand-100 transition-all duration-150 cursor-pointer border-none">编辑</button>
                  <button @click="handleDeleteModel(m.id)" class="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-150 cursor-pointer border-none">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="modelRecords.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-ink-muted text-sm">{{ modelLoading ? '加载中...' : '暂无模型' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create User Modal -->
    <div v-if="showUserModal" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" @click.self="showUserModal = false">
      <div class="card p-6 w-full max-w-md mx-4 animate-slide-up" @click.stop>
        <h3 class="font-heading font-semibold text-ink text-lg mb-4">{{ isEditingUser ? '编辑用户' : '新增用户' }}</h3>
        <div v-if="userError" class="mb-3 p-2 rounded-lg bg-red-50 text-sm text-red-700">{{ userError }}</div>
        <div class="space-y-4">
          <div><label class="block text-sm font-semibold text-ink mb-1">账号</label><input v-model="userForm.account" class="glass-input" :disabled="isEditingUser" /></div>
          <div><label class="block text-sm font-semibold text-ink mb-1">用户名</label><input v-model="userForm.username" class="glass-input" /></div>
          <div><label class="block text-sm font-semibold text-ink mb-1">密码</label><input v-model="userForm.password" type="password" class="glass-input" :placeholder="isEditingUser ? '留空则不修改' : ''" /></div>
          <div><label class="block text-sm font-semibold text-ink mb-1">邮箱</label><input v-model="userForm.email" type="email" class="glass-input" /></div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">角色</label>
            <select v-model="userForm.role" class="glass-input" :disabled="isEditingUser">
              <option value="student">学生</option>
              <option value="teacher">教师</option>
            </select>
          </div>
          <div class="flex gap-3">
            <button @click="handleCreateUser" class="btn-primary" :disabled="userSaving">{{ userSaving ? '保存中...' : (isEditingUser ? '保存修改' : '创建') }}</button>
            <button @click="showUserModal = false" class="btn-outline">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Model Modal -->
    <div v-if="showModelModal" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" @click.self="showModelModal = false">
      <div class="card p-6 w-full max-w-md mx-4 animate-slide-up" @click.stop>
        <h3 class="font-heading font-semibold text-ink text-lg mb-4">{{ isEditingModel ? '编辑模型' : '新增模型' }}</h3>
        <div v-if="modelError" class="mb-3 p-2 rounded-lg bg-red-50 text-sm text-red-700">{{ modelError }}</div>
        <div class="space-y-4">
          <div><label class="block text-sm font-semibold text-ink mb-1">模型名称</label><input v-model="modelForm.name" class="glass-input" /></div>
          <div>
            <label class="block text-sm font-semibold text-ink mb-1">类型</label>
            <select v-model="modelForm.mode" class="glass-input">
              <option :value="1">视觉模型（提取题目）</option>
              <option :value="2">语言模型（批改题目）</option>
            </select>
          </div>
          <div class="flex gap-3">
            <button @click="handleCreateModel" class="btn-primary" :disabled="modelSaving">{{ modelSaving ? '保存中...' : (isEditingModel ? '保存修改' : '创建') }}</button>
            <button @click="showModelModal = false" class="btn-outline">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>