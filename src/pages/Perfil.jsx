import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLE_LABELS } from '../lib/constants.js'

export function Perfil() {
  const { user, refresh } = useAuth()
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState(null)
  const [aprobadorEmail, setAprobadorEmail] = useState('')
  const [aprobadorSaved, setAprobadorSaved] = useState(false)

  useEffect(() => {
    setAprobadorEmail(user?.aprobadorEmail || '')
  }, [user?.aprobadorEmail])

  const upload = useMutation({
    mutationFn: (file) => api.upload('/users/me/signature', file),
    onSuccess: async () => {
      await refresh()
      queryClient.invalidateQueries()
    },
  })

  const saveAprobador = useMutation({
    mutationFn: (email) => api.put('/users/me/aprobador', { aprobadorEmail: email || null }),
    onSuccess: async () => {
      await refresh()
      setAprobadorSaved(true)
      setTimeout(() => setAprobadorSaved(false), 3000)
    },
  })

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    upload.mutate(file)
  }

  function handleAprobadorSubmit(e) {
    e.preventDefault()
    saveAprobador.mutate(aprobadorEmail.trim())
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
            <dt className="text-neutral-500">Roles</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {(user?.roles ?? []).map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {ROLE_LABELS[r] ?? r}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-2 text-lg font-semibold">Mi aprobador</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Escribe el correo corporativo de la persona que debe dar el visto bueno de aprobador a tus solicitudes.
          Esa persona recibirá automáticamente el rol de Aprobador en el portal (sin quitarle los roles que ya tenga).
        </p>
        <form onSubmit={handleAprobadorSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            placeholder="correo@cccm.org"
            value={aprobadorEmail}
            onChange={(e) => setAprobadorEmail(e.target.value)}
            className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            type="submit"
            disabled={saveAprobador.isPending}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            Guardar
          </button>
        </form>
        {saveAprobador.isError && <p className="mt-1 text-xs text-red-600">{saveAprobador.error.message}</p>}
        {aprobadorSaved && <p className="mt-1 text-xs text-emerald-600">Aprobador guardado.</p>}
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
