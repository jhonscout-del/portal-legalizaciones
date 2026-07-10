import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { formatCOP, formatDate } from '../../lib/constants.js'

export function ListadoLegalizaciones() {
  const legalizaciones = useQuery({ queryKey: ['legalizaciones'], queryFn: () => api.get('/legalizaciones') })
  const [search, setSearch] = useState('')

  const filtered = (legalizaciones.data ?? []).filter((l) => {
    if (!search) return true
    const haystack = `${l.nombreActividad ?? ''} ${l.project?.name ?? ''} ${l.solicitante?.name ?? ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Legalizaciones</h1>
        <Link to="/legalizaciones/nueva" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
          + Nueva legalización
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por actividad, proyecto o solicitante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <a href="/api/legalizaciones/reporte.xlsx" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700">
          Exportar reporte
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha anticipo</th>
              <th>Proyecto</th>
              <th>Actividad</th>
              <th>Anticipo</th>
              <th>Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(l.fechaSolicitudAnticipo)}</td>
                <td>{l.project?.name}</td>
                <td>{l.nombreActividad}</td>
                <td>{formatCOP(l.valorAnticipo)}</td>
                <td className={l.resumen.aReembolsar ? 'text-red-600' : ''}>
                  {formatCOP(Math.abs(l.resumen.saldo))}{l.resumen.aReembolsar ? ' (reembolso)' : ''}
                </td>
                <td className="px-4"><Link to={`/legalizaciones/${l.id}`} className="text-sky-600 hover:underline">Ver</Link></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">No hay legalizaciones que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
