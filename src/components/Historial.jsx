import { formatDateTime } from '../lib/constants.js'

// Reconstruye una línea de tiempo a partir de los campos de fecha/autor que
// ya existen en cada documento (createdAt, vistoBueno*At, firma*At,
// rechazadoAt...) — no requiere una tabla de auditoría aparte.
export function Historial({ eventos }) {
  const ordenados = eventos.filter((e) => e.at).sort((a, b) => new Date(a.at) - new Date(b.at))

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-3 text-lg font-semibold">Historial</h2>
      {ordenados.length === 0 ? (
        <p className="text-sm text-neutral-500">Sin eventos registrados.</p>
      ) : (
        <ol className="flex flex-col gap-3 border-l border-neutral-200 pl-4 dark:border-neutral-800">
          {ordenados.map((e, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
              <p className="text-sm font-medium">{e.label}</p>
              <p className="text-xs text-neutral-500">
                {e.name ? `${e.name} — ` : ''}{formatDateTime(e.at)}
              </p>
              {e.detail && <p className="mt-0.5 text-xs text-neutral-500">"{e.detail}"</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
