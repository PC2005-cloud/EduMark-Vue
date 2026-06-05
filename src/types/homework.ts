export interface TaskOut {
    task_id: string
    user_id: number
    subject: string | null
    grade: string | null
    mode: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    create_time: string | null
    update_time: string | null
    average_score?: number
}

export interface ImageInfo {
    url: string
}

export interface BlockInfo {
    url?: string
    x1: number
    y1: number
    x2: number
    y2: number
}

export interface CorrectionInfo {
    score: number
    result: 'correct' | 'wrong' | 'partial'
    comment: string | null
    analysis: string | null
}

export interface KnowledgeRef {
    knowledge_id: number
    title: string
    content: string
    score: number
}

export interface QuestionResult {
    no: string
    question_text: string | null
    student_answer: string | null
    question_type: string | null
    blocks: BlockInfo[]
    correction: CorrectionInfo | null
    knowledge_refs: KnowledgeRef[]
    create_time: string | null
}

export interface HomeworkResult {
    task_id: string
    status: string
    subject: string | null
    grade: string | null
    mode: string | null
    create_time: string | null
    images: ImageInfo[]
    questions: QuestionResult[]
}

export interface StatusResponse {
    task_id: string
    status: string
}

export interface SubmitResponse {
    task_id: string
}