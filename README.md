# Portal de Formatos Administrativos CCCM

Portal web para digitalizar los formatos administrativos de la CCCM: Solicitud
de Viáticos, Solicitud Operacional, Solicitud de Recursos Género y ERM,
Legalización de anticipos y Reporte de Viaje, más el catálogo de
proyectos/unidades de negocio.

- **Cliente**: React + Vite + Tailwind v4, en la raíz del repo.
- **Servidor**: Express + Prisma (SQLite) en [server/](server/).
- **Login**: cuentas corporativas de Microsoft 365 (Entra ID / Azure AD).

## Puesta en marcha

1. Instala dependencias en ambos paquetes:
   ```
   npm install
   npm --prefix server install
   ```
2. Configura `server/.env` (ver comentarios en el archivo):
   - Registra una app en Azure Portal → Microsoft Entra ID → Registros de
     aplicaciones, con URI de redirección `http://localhost:5173/api/auth/callback`.
   - Copia `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` y genera un `AZURE_CLIENT_SECRET`.
   - Define `BOOTSTRAP_ADMIN_EMAIL` con tu correo corporativo: tu primer login
     te asigna el rol ADMINISTRATIVO automáticamente.
   - Mientras configuras Azure, deja `DEV_AUTH_BYPASS=true` para entrar con
     usuarios simulados desde la pantalla de login ("Acceso de desarrollo").
     Ponlo en `false` antes de pasar a producción.
3. Prepara la base de datos:
   ```
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Levanta cliente y servidor juntos desde la raíz:
   ```
   npm run dev
   ```
   Abre `http://localhost:5173` (siempre por este puerto — el proxy de Vite
   reenvía `/api` al servidor en el 4000; no se debe entrar directo por 4000
   porque la cookie de sesión no viajaría bien entre orígenes distintos).

## Roles

- **SOLICITANTE**: diligencia y consulta sus propios formatos.
- **CONTABLE**: da visto bueno contable en solicitudes y firma legalizaciones.
- **ADMINISTRATIVO**: da visto bueno administrativo, administra el catálogo de
  proyectos/unidades de negocio y asigna roles a los usuarios (menú "Usuarios
  y Roles").

Los usuarios se crean automáticamente la primera vez que inician sesión con
Microsoft; un ADMINISTRATIVO les asigna el rol correspondiente.

## Exportación

Cada solicitud, legalización e informe de viaje se puede exportar a PDF
(con espacio para firma manuscrita) y a Excel desde su página de detalle.
