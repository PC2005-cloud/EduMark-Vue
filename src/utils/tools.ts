import MarkdownIt from 'markdown-it'
import { katex } from '@mdit/plugin-katex'
import 'katex/dist/katex.min.css'





const markDownIt = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
})

    .use(katex, {
        throwOnError: false,        // 公式错了不崩
        strict: false,              // 宽松模式
        displayMode: false,         // 行内公式默认
        output: 'htmlAndMathml',    // 无障碍 + 兼容性
    })

export {markDownIt}