import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ROLE_LABELS } from '../../lib/constants.js'
import { api } from '../../lib/api.js'

const ASSIGNABLE_ROLES = ['SOLICITANTE', 'APROBADOR', 'CONTABLE', 'ADMINISTRATIVO']

export function UsersRoles() {
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users') })

  const updateRoles = useMutation({
    mutationFn: ({ id, roles }) => api.put(`/users/${id}/roles`, { roles }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  function toggleRole(u, role) {
    // SOLICITANTE es automático para todos y no se puede quitar desde aquí.
    if (role === 'SOLICITANTE') return
    const has = u.roles.includes(role)
    const roles = has ? u.roles.filter((r) => r !== role) : [...u.roles, role]
    updateRoles.mutate({ id: u.id, roles })
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Los usuarios se crean automáticamente al iniciar sesión con Microsoft y siempre tienen el rol Solicitante.
        Un mismo usuario puede tener varios roles a la vez (por ejemplo, Solicitante + Aprobador + Administrativo).
        El rol Aprobador también se puede asignar automáticamente cuando alguien lo declara como su aprobador en
        "Mi perfil".
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="py-2">Nombre</th>
              <th>Correo</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-3">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <label key={role} className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={u.roles.includes(role)}
                          disabled={role === 'SOLICITANTE'}
                          onChange={() => toggleRole(u, role)}
                        />
                        {ROLE_LABELS[role]}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {users.data?.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-neutral-500">Aún no hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
