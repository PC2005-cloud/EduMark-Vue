import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConfigOut, ConfigUpdate } from '@/types/config'
import { configApi } from '@/api/config'

export const useConfigStore = defineStore('config', () => {
    const config = ref<ConfigOut | null>(null)
    const loading = ref(false)

    async function fetchConfig() {
        try {
            loading.value = true
            config.value = await configApi.getMyConfig()
        } catch {
            config.value = null
        } finally {
            loading.value = false
        }
    }

    async function updateConfig(data: ConfigUpdate) {
        config.value = await configApi.updateMyConfig(data)
        return config.value
    }

    return { config, loading, fetchConfig, updateConfig }
})