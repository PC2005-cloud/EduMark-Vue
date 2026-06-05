import { http } from '@/utils/axios'
import type { LoginForm, RegisterForm, RefreshForm } from '@/types/auth'
import type { UserOut } from '@/types/user'
import type { TokenResponse } from '@/types/api'

export const authApi = {
    register: (data: RegisterForm) =>
        http.post<UserOut>('/auth/register', data),

    login: (data: LoginForm) =>
        http.post<TokenResponse>('/auth/login', data),

    refresh: (data: RefreshForm) =>
        http.post<TokenResponse>('/auth/refresh', data),

    me: () =>
        http.get<UserOut>('/auth/me'),
}