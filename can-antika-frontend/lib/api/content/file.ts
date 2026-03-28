import { api } from "../../api-client";

export const fileApi = {
    upload: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return api.post<string>("/v1/files/upload", { body: formData, timeoutMs: 60000 });
    },

    uploadMultiple: (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        return api.post<string[]>("/v1/files/upload-multiple", { body: formData, timeoutMs: 60000 });
    },
};
