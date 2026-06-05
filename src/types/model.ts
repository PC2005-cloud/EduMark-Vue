export interface ModelOut {
    id: number
    name: string
    mode: number // 1=视觉模型, 2=语言模型
}

export interface ModelCreate {
    name: string
    mode: number
}