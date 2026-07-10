import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { formatDate } from '../../lib/constants.js'

export function ListadoInformes() {
  const informes = useQuery({ queryKey: ['informes-viaje'], queryFn: () => api.get('/informes-viaje') })
  const [search, setSearch] = useState('')

  const filtered = (informes.data ?? []).filter((i) => {
    if (!search) return true
    const haystack = `${i.nombreSolicitante ?? ''} ${i.project?.name ?? ''} ${i.ruta ?? ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Informes de Viaje</h1>
        <Link to="/informes-viaje/nuevo" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
          + Nuevo informe
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por solicitante, proyecto o ruta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <a href="/api/informes-viaje/reporte.xlsx" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
          Exportar reporte
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha inicio</th>
              <th>Solicitante</th>
              <th>Proyecto</th>
              <th>Ruta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(i.fechaInicioViaje)}</td>
                <td>{i.nombreSolicitante}</td>
                <td>{i.project?.name}</td>
                <td>{i.ruta}</td>
                <td className="px-4"><Link to={`/informes-viaje/${i.id}`} className="text-sky-600 hover:underline">Ver</Link></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-500">No hay informes que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
