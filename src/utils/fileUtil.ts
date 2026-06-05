import {ElMessage} from "element-plus";

export class FileUtils {
    static downloadFile(fileName: string, fileUrl: string) {
        fetch(fileUrl)
            .then(response => response.blob())
            .then(blob => {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                ElMessage.success('下载成功' as any)
            })
            .catch(error => {
                ElMessage.error(`下载失败:${error}` as any)
            });
    }
}