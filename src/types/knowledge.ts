export interface KnowledgeOut {
    id: number
    user_id: number
    title: string
    url: string
    subject: string | null
    grade: string | null
    status: 'pending' | 'parsing' | 'completed' | 'failed'
    chunk: number
    create_time: string | null
}