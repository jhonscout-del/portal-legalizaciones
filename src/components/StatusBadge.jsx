import { ESTADO_LABELS } from '../lib/constants.js'

const COLORS = {
  BORRADOR: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  RECHAZADA: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  APROBADA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  LEGALIZADA: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
}

export function StatusBadge({ estado }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLORS[estado] ?? COLORS.BORRADOR}`}>
      {ESTADO_LABELS[estado] ?? estado}
    </span>
  )
}
