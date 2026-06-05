export interface ConfigOut {
    id: number
    user_id: number
    rec_mode: 'aliyun' | 'bailian'
    enable_enhance: boolean
    enable_knowledge: boolean
    vl_model: string | null
    gl_model: string | null
    create_time: string | null
    update_time: string | null
}

export interface ConfigUpdate {
    rec_mode?: 'aliyun' | 'bailian'
    enable_enhance?: boolean
    enable_knowledge?: boolean
    vl_model?: string
    gl_model?: string
}