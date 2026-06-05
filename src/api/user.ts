import { http } from '@/utils/axios'
import type { UserOut, UserCreate, UserUpdate } from '@/types/user'
import type { PageDTO, PageVO } from '@/types/api'

export const userApi = {
    page: (data: PageDTO) =>
        http.post<PageVO<UserOut>>('/users/page', data),

    get: (id: number) =>
        http.get<UserOut>(`/users/${id}`),

    create: (data: UserCreate) =>
        http.post<UserOut>('/users', data),

    update: (id: number, data: UserUpdate) =>
        http.put<UserOut>(`/users/${id}`, data),

    delete: (id: number) =>
        http.delete<null>(`/users/${id}`),
}