import { ref, shallowRef, onUnmounted } from 'vue'
import type { PageDTO, PageVO } from '@/types/api'

// 轮询 hook，用于查询作业状态
export function usePolling(fn: () => Promise<void>, interval = 2000) {
    const isPolling = ref(false)
    let timer: ReturnType<typeof setInterval> | null = null

    function start() {
        if (isPolling.value) return
        isPolling.value = true
        fn()
        timer = setInterval(fn, interval)
    }

    function stop() {
        isPolling.value = false
        if (timer) {
            clearInterval(timer)
            timer = null
        }
    }

    onUnmounted(stop)

    return { isPolling, start, stop }
}

// 分页逻辑
export function usePagination<T>(fetchFn: (dto: PageDTO) => Promise<PageVO<T>>) {
    const records = shallowRef<T[]>([])
    const total = ref(0)
    const pageNum = ref(1)
    const pageSize = ref(10)
    const loading = ref(false)

    async function load() {
        loading.value = true
        try {
            const res = await fetchFn({ page_num: pageNum.value, page_size: pageSize.value })
            records.value = res.rows as T[]
            total.value = res.total
        } catch {
            // error handled by axios interceptor
        } finally {
            loading.value = false
        }
    }

    function setPage(n: number) {
        pageNum.value = n
        load()
    }

    return {
        records, total, pageNum, pageSize, loading,
        load, setPage,
    }
}