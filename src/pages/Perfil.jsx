import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../lib/constants.js'

export function Perfil() {
  const { user, refresh } = useAuth()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState(null)

  const upload = useMutation({
    mutationFn: (file) => api.upload('/users/me/signature', file),
    onSuccess: async () => {
      await refresh()
      queryClient.invalidateQueries()
    },
  })

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    upload.mutate(file)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>

      <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <dt className="text-neutral-500">Nombre</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Correo</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Rol</dt>
            <dd className="font-medium">{ROLE_LABELS[user?.role] ?? user?.role}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-lg font-semibold">Mi firma</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Sube una imagen de tu firma (PNG, JPEG o WEBP, máx. 2MB). Se usará automáticamente en los PDF de los
          documentos que apruebes o firmes.
        </p>

        <img
          src={preview || `/api/users/${user?.id}/signature?t=${Date.now()}`}
          alt="Firma actual"
          className="mb-3 h-16 border border-dashed border-neutral-300 bg-white object-contain dark:border-neutral-700"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
          onLoad={(e) => { e.currentTarget.style.visibility = 'visible' }}
        />

        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="text-sm" />
        {upload.isPending && <p className="mt-1 text-xs text-neutral-500">Subiendo…</p>}
        {upload.isError && <p className="mt-1 text-xs text-red-600">{upload.error.message}</p>}
        {upload.isSuccess && <p className="mt-1 text-xs text-emerald-600">Firma actualizada.</p>}
      </section>
    </div>
  )
}
