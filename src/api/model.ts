import { http } from '@/utils/axios'
import type { ModelOut, ModelCreate } from '@/types/model'
import type { PageDTO, PageVO } from '@/types/api'

export const modelApi = {
    page: (data: PageDTO) =>
        http.post<PageVO<ModelOut>>('/models/page', data),

    get: (id: number) =>
        http.get<ModelOut>(`/models/${id}`),

    create: (data: ModelCreate) =>
        http.post<ModelOut>('/models', data),

    update: (id: number, data: ModelCreate) =>
        http.put<ModelOut>(`/models/${id}`, data),

    delete: (id: number) =>
        http.delete<null>(`/models/${id}`),
}