import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterPage.vue'),
        meta: { guest: true },
    },
    {
        path: '/',
        component: () => import('@/components/layout/AppLayout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/DashboardPage.vue'),
            },
            {
                path: 'homework',
                name: 'Homework',
                component: () => import('@/views/homework/HomeworkList.vue'),
                meta: { notForTeacher: true, notForAdmin: true },
            },
            {
                path: 'statistics',
                name: 'Statistics',
                component: () => import('@/views/statistics/StatisticsPage.vue'),
            },
            {
                path: 'homework/submit',
                name: 'HomeworkSubmit',
                component: () => import('@/views/homework/HomeworkSubmit.vue'),
                meta: { notForTeacher: true, notForAdmin: true },
            },
            {
                path: 'homework/result/:taskId',
                name: 'HomeworkResult',
                component: () => import('@/views/homework/HomeworkResult.vue'),
            },
            {
                path: 'knowledge',
                name: 'Knowledge',
                component: () => import('@/views/knowledge/KnowledgeList.vue'),
                meta: { notForAdmin: true },
            },
            {
                path: 'settings',
                name: 'Settings',
                component: () => import('@/views/settings/SettingsPage.vue'),
                meta: { notForTeacher: true, notForAdmin: true },
            },
            {
                path: 'admin',
                name: 'Admin',
                component: () => import('@/views/admin/AdminDashboard.vue'),
                meta: { requiresAdmin: true },
            },
            {
                path: 'admin/homework',
                name: 'AdminHomework',
                component: () => import('@/views/admin/AdminHomework.vue'),
                meta: { requiresAdmin: true },
            },
            {
                path: 'admin/knowledge',
                name: 'AdminKnowledge',
                component: () => import('@/views/admin/AdminKnowledge.vue'),
                meta: { requiresAdmin: true },
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to, _from, next) => {
    const auth = useAuthStore()

    // 尝试通过 token 恢复登录状态
    if (!auth.isLoggedIn && localStorage.getItem('access_token')) {
        await auth.fetchUser()
    }

    if (to.meta.requiresAuth && !auth.isLoggedIn) {
        next('/login')
    } else if (to.meta.guest && auth.isLoggedIn) {
        next('/')
    } else if (to.meta.requiresAdmin && !auth.isAdmin) {
        next('/')
    } else if (to.meta.notForTeacher && auth.isTeacher) {
        next('/')
    } else if (to.meta.notForAdmin && auth.isAdmin) {
        next('/')
    } else {
        next()
    }
})

export default router