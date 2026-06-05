// 通用 API 响应
export interface Result<T = unknown> {
    code: number
    message: string
    data: T | null
}

// 分页请求
export interface PageDTO {
    page_num: number
    page_size: number
    query?: Record<string, unknown>
    sort_fields?: SortField[]
}

export interface SortField {
    field: string
    direction: 'asc' | 'desc'
}

// 分页响应
export interface PageVO<T> {
    rows: T[]
    total: number
}

// JWT 令牌
export interface TokenResponse {
    access_token: string
    refresh_token: string
    token_type: string
}