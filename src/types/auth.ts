export interface LoginForm {
    account: string
    password: string
}

export interface RegisterForm {
    account: string
    username: string
    password: string
    email?: string
    role: 'student' | 'teacher'
}

export interface RefreshForm {
    token: string
}