import { http } from '@/utils/axios'
import type { KnowledgeOut } from '@/types/knowledge'
import type { PageDTO, PageVO } from '@/types/api'

export const knowledgeApi = {
    page: (data: PageDTO) =>
        http.post<PageVO<KnowledgeOut>>('/knowledge/page', data),

    get: (id: number) =>
        http.get<KnowledgeOut>(`/knowledge/${id}`),

    upload: (formData: FormData) =>
        http.upload<KnowledgeOut>('/knowledge/upload', formData),

    delete: (id: number) =>
        http.delete<null>(`/knowledge/${id}`),
}