<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; logout: [] }>()

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const navItems = computed(() => {
  const items = [
    { tab: 'dashboard', label: '工作台', icon: 'grid', route: '/' },
  ]
  if (auth.isStudent) {
    items.push({ tab: 'homework', label: '我的作业', icon: 'file', route: '/homework' })
  }
    if (auth.isAdmin || auth.isStudent) {
  items.push({ tab: 'statistics', label: '统计分析', icon: 'chart', route: '/statistics' })

    }

  if (auth.isTeacher || auth.isStudent) {
    items.push({ tab: 'knowledge', label: '知识库', icon: 'book', route: '/knowledge' })
  }
  if (auth.isAdmin) {
    items.push({ tab: 'admin-homework', label: '作业预览', icon: 'file', route: '/admin/homework' })
    items.push({ tab: 'admin-knowledge', label: '知识预览', icon: 'book', route: '/admin/knowledge' })
  }
  if (auth.isStudent) {
    items.push({ tab: 'settings', label: '个人设置', icon: 'settings', route: '/settings' })
  }
  if (auth.canManageSystem) {
    items.push({ tab: 'admin', label: '管理后台', icon: 'users', route: '/admin' })
  }
  return items
})

// For admin dashboard, exact match only to avoid conflict with /admin/* routes
function isActive(path: string) {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path === path || (path !== '/' && route.path.startsWith(path))
}

function navigate(url: string) {
  router.push(url)
  emit('close')
}
</script>

<template>
  <aside
    class="fixed lg:sticky top-0 left-0 h-screen w-56 bg-surface border-r border-surface-muted flex flex-col z-50 transition-transform duration-200 shadow-sm"
    :class="open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 h-16 border-b border-surface-muted shrink-0">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path d="M12 14v7"/>
        </svg>
      </div>
      <h2 class="text-lg font-heading font-bold text-ink tracking-tight">EduMark</h2>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
      <div class="px-3 py-2 text-[10px] font-semibold text-ink-muted uppercase tracking-widest">主菜单</div>

      <button
        v-for="item in navItems"
        :key="item.tab"
        @click="navigate(item.route)"
        class="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
        :class="isActive(item.route) ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-ink-secondary hover:bg-brand-50 hover:text-brand-700'"
      >
        <svg v-if="item.icon === 'grid'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <svg v-else-if="item.icon === 'file'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <svg v-else-if="item.icon === 'book'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <svg v-else-if="item.icon === 'settings'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <svg v-else-if="item.icon === 'users'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <svg v-else-if="item.icon === 'chart'" class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        {{ item.label }}
      </button>
    </nav>

    <!-- User info & logout -->
    <div class="flex items-center gap-3 px-4 py-4 border-t border-surface-muted mx-3 shrink-0">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {{ auth.username.charAt(0) }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-ink truncate">{{ auth.username }}</p>
        <p class="text-xs text-ink-muted">{{ auth.roleLabel }}</p>
      </div>
      <button @click="$emit('logout')" class="cursor-pointer p-1.5 rounded-lg hover:bg-surface-muted transition-colors" title="退出登录">
        <svg class="w-4 h-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>
</template>