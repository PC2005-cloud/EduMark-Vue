export interface UserOut {
    id: number
    account: string
    username: string
    email: string | null
    role: 'student' | 'teacher' | 'admin'
    is_active: boolean
    create_time: string | null
    update_time: string | null
}

export interface UserCreate {
    account: string
    username: string
    password: string
    email?: string
    role: 'student' | 'teacher'
}

export interface UserUpdate {
    username?: string
    email?: string
    is_active?: boolean
}