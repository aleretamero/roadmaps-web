import { API_BASE_URL } from './client'
import type { Schemas } from './client'
import { ApiError } from './errors'
import type { ProblemDetails } from './errors'

/** Limite de envio do contrato (`POST /topics/{id}/files`). */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/**
 * Envia um arquivo para a pasta `dir` do tópico, com progresso (0–1).
 * Usa XMLHttpRequest só porque o `fetch` não informa o progresso do envio;
 * caminho, campos e resposta seguem o contrato (`uploadFile`).
 */
export function uploadFile(
  topicId: number,
  file: File,
  dir: string,
  onProgress?: (fraction: number) => void,
): Promise<Schemas['FileNode']> {
  return new Promise((resolve, reject) => {
    const body = new FormData()
    body.append('file', file)
    body.append('path', dir)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/topics/${topicId}/files`)
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      let json: unknown
      try {
        json = JSON.parse(xhr.responseText)
      } catch {
        json = undefined
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        resolve(json as Schemas['FileNode'])
      } else
        reject(new ApiError(xhr.status, json as ProblemDetails | undefined))
    }
    xhr.onerror = () => reject(new ApiError(0))
    xhr.send(body)
  })
}
