import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { StatusBadge } from '../../components/StatusBadge.jsx'
import { TIPO_PARAM_TO_ENUM } from '../../schemas/solicitud.js'
import { TIPO_SOLICITUD_LABELS, ESTADO_LABELS, formatCOP, formatDate } from '../../lib/constants.js'

export function ListadoSolicitudes() {
  const { tipo } = useParams()
  const { user } = useAuth()
  const tipoEnum = TIPO_PARAM_TO_ENUM[tipo]
  const [mine, setMine] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const solicitudes = useQuery({
    queryKey: ['solicitudes', tipoEnum, mine],
    queryFn: () => api.get(`/solicitudes?tipo=${tipoEnum}${mine ? '&mine=1' : ''}`),
  })

  const filtered = (solicitudes.data ?? []).filter((s) => {
    if (estado && s.estado !== estado) return false
    if (!search) return true
    const haystack = `${s.aFavorDe ?? ''} ${s.porConceptoDe ?? ''} ${s.project?.name ?? ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Solicitudes — {TIPO_SOLICITUD_LABELS[tipoEnum]}</h1>
        <Link to={`/solicitudes/${tipo}`} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900">
          + Nueva solicitud
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
          Mostrar solo mis solicitudes ({user?.name})
        </label>
        <input
          type="text"
          placeholder="Buscar por beneficiario, concepto o proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <a
          href={`/api/solicitudes/reporte.xlsx?tipo=${tipoEnum}${mine ? `&mine=1` : ''}`}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Exportar reporte
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="px-4 py-2">Fecha</th>
              <th>A favor de</th>
              <th>Proyecto</th>
              <th>Valor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="px-4 py-2">{formatDate(s.fecha)}</td>
                <td>{s.aFavorDe}</td>
                <td>{s.project?.name}</td>
                <td>{formatCOP(s.items?.reduce((sum, i) => sum + i.valor, 0))}</td>
                <td><StatusBadge estado={s.estado} /></td>
                <td className="px-4">
                  <Link to={`/solicitudes/detalle/${s.id}`} className="text-sky-600 hover:underline">Ver</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500">No hay solicitudes que coincidan con el filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
