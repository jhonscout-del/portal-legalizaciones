import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api.js'
import { ROLE_LABELS } from '../../lib/constants.js'

export function UsersRoles() {
  const queryClient = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users') })

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Los usuarios se crean automáticamente al iniciar sesión con Microsoft. Asigna aquí su rol dentro del portal.
      </p>

      <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
              <th className="py-2">Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-b border-neutral-100 dark:border-neutral-800/60">
                <td className="py-2">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
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
