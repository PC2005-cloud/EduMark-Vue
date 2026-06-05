import { http } from '@/utils/axios'
import type { ConfigOut, ConfigUpdate } from '@/types/config'

export const configApi = {
    getMyConfig: () =>
        http.get<ConfigOut>('/config/me'),

    updateMyConfig: (data: ConfigUpdate) =>
        http.put<ConfigOut>('/config/me', data),
}