import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserOut } from '@/types/user'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserOut | null>(null)
    const loading = ref(false)

    const isLoggedIn = computed(() => !!user.value)
    const isAdmin = computed(() => user.value?.role === 'admin')
    const isTeacher = computed(() => user.value?.role === 'teacher')
    const isStudent = computed(() => user.value?.role === 'student')
    const canManageKnowledge = computed(() => isTeacher.value || isAdmin.value)
    const canManageSystem = computed(() => isAdmin.value)
    const username = computed(() => user.value?.username || '')
    const roleLabel = computed(() => {
        const map: Record<string, string> = { admin: '管理员', teacher: '教师', student: '学生' }
        return user.value ? map[user.value.role] || user.value.role : ''
    })

    async function fetchUser() {
        try {
            loading.value = true
            user.value = await authApi.me()
        } catch {
            user.value = null
        } finally {
            loading.value = false
        }
    }

    function setUser(u: UserOut) {
        user.value = u
    }

    function logout() {
        user.value = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    return {
        user, loading,
        isLoggedIn, isAdmin, isTeacher, isStudent,
        canManageKnowledge, canManageSystem,
        username, roleLabel,
        fetchUser, setUser, logout,
    }
})