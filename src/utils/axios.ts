import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import axios from 'axios'
import type { Result } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const myAxios: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// 请求拦截器
myAxios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error: AxiosError) => Promise.reject(error)
)

// 响应拦截器
myAxios.interceptors.response.use(
    (response: AxiosResponse<Result>) => {
        return response
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // 401 且未重试过：尝试 refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
                try {
                    const res = await axios.post<Result<{ access_token: string; refresh_token: string }>>(
                        `${API_BASE_URL}/auth/refresh`,
                        { token: refreshToken }
                    )
                    if (res.data.code === 1 && res.data.data) {
                        const { access_token, refresh_token } = res.data.data
                        localStorage.setItem('access_token', access_token)
                        localStorage.setItem('refresh_token', refresh_token)
                        originalRequest.headers.Authorization = `Bearer ${access_token}`
                        return myAxios(originalRequest)
                    }
                } catch {
                    // refresh 失败，清除 token 跳转登录
                    localStorage.removeItem('access_token')
                    localStorage.removeItem('refresh_token')
                    window.location.href = '/login'
                }
            } else {
                localStorage.removeItem('access_token')
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// 从响应中提取 data（统一 Result 解包）
function extractData<T>(response: AxiosResponse<Result<T>>): T {
    if (response.data.code !== 1) {
        throw new Error(response.data.message || '请求失败')
    }
    return response.data.data as T
}

// 封装常用方法
export const http = {
    get: async <T = unknown>(url: string, params?: Record<string, unknown>) => {
        const res = await myAxios.get<Result<T>>(url, { params })
        return extractData(res)
    },
    post: async <T = unknown>(url: string, data?: unknown) => {
        const res = await myAxios.post<Result<T>>(url, data)
        return extractData(res)
    },
    put: async <T = unknown>(url: string, data?: unknown) => {
        const res = await myAxios.put<Result<T>>(url, data)
        return extractData(res)
    },
    delete: async <T = unknown>(url: string) => {
        const res = await myAxios.delete<Result<T>>(url)
        return extractData(res)
    },
    upload: async <T = unknown>(url: string, formData: FormData) => {
        const res = await myAxios.post<Result<T>>(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return extractData(res)
    },
}

export { myAxios }