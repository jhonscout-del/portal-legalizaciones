import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { formatFileSize } from '../lib/constants.js'

export function AttachmentsPanel({ relatedType, relatedId, attachments, queryKey }) {
  const queryClient = useQueryClient()
  const inputRef = useRef(null)

  const upload = useMutation({
    mutationFn: (file) => api.upload(`/attachments/${relatedType}/${relatedId}`, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      if (inputRef.current) inputRef.current.value = ''
    },
  })

  const remove = useMutation({
    mutationFn: (id) => api.del(`/attachments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-lg font-semibold">Archivos adjuntos</h2>

      <div className="flex flex-col gap-2">
        {attachments?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
            <a href={`/api/attachments/file/${a.id}`} className="text-sky-600 hover:underline" target="_blank" rel="noreferrer">
              {a.filename}
            </a>
            <span className="text-xs text-neutral-500">
              {formatFileSize(a.size)} · {a.uploadedBy?.name}
            </span>
            <button type="button" onClick={() => remove.mutate(a.id)} className="text-xs text-red-600 hover:underline">
              Eliminar
            </button>
          </div>
        ))}
        {attachments?.length === 0 && <p className="text-sm text-neutral-500">Sin archivos adjuntos.</p>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          onChange={(e) => e.target.files[0] && upload.mutate(e.target.files[0])}
          className="text-sm"
        />
        {upload.isPending && <span className="text-xs text-neutral-500">Subiendo…</span>}
      </div>
      {upload.isError && <p className="mt-1 text-xs text-red-600">{upload.error.message}</p>}
    </section>
  )
}
