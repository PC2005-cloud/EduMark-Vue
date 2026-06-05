<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AppSidebar from './AppSidebar.vue'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Mobile overlay -->
    <div
      v-show="sidebarOpen"
      class="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <AppSidebar
      :open="sidebarOpen"
      @close="sidebarOpen = false"
      @logout="handleLogout"
    />

    <!-- Mobile menu button -->
    <button
      @click="toggleSidebar"
      class="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-surface-muted shadow-sm cursor-pointer"
    >
      <svg class="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <main class="flex-1 min-h-screen px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto w-full">
      <router-view />
    </main>
  </div>
</template>