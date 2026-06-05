import { http } from '@/utils/axios'
import type { HomeworkResult, StatusResponse, SubmitResponse } from '@/types/homework'
import type { PageDTO, PageVO } from '@/types/api'
import type { TaskOut } from '@/types/homework'

export const homeworkApi = {
    submit: (formData: FormData) =>
        http.upload<SubmitResponse>('/homework/submit', formData),

    getStatus: (taskId: string) =>
        http.get<StatusResponse>(`/homework/status/${taskId}`),

    getResult: (taskId: string) =>
        http.get<HomeworkResult>(`/homework/result/${taskId}`),

    pageTask: (data: PageDTO) =>
        http.post<PageVO<TaskOut>>('/homework/task/page', data),

    delete: (taskId: string) =>
        http.delete<null>(`/homework/task/${taskId}`),
}