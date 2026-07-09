# Portal de Formatos Administrativos CCCM

Portal web para digitalizar los formatos administrativos de la CCCM: Solicitud
de Viáticos, Solicitud Operacional, Solicitud de Recursos Género y ERM,
Legalización de anticipos y Reporte de Viaje, más el catálogo de
proyectos/unidades de negocio.

- **Cliente**: React + Vite + Tailwind v4, en la raíz del repo.
- **Servidor**: Express en [server/](server/).
- **Base de datos**: un libro de Excel (`CCCM-Portal/CCCM-DB.xlsx`) guardado en
  el OneDrive de una cuenta de servicio, leído/escrito vía Microsoft Graph
  (sin base de datos tradicional que administrar).
- **Adjuntos y firmas**: también se guardan en OneDrive (no en disco local).
- **Login**: cuentas corporativas de Microsoft 365 (Entra ID / Azure AD), más
  un acceso de administrador local independiente.

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
   - En **Permisos de API** del mismo registro, agrega estos permisos de
     **aplicación** de Microsoft Graph y concede consentimiento de administrador:
     - `Mail.Send` (envío de correo a destinatarios manuales)
     - `Files.ReadWrite.All` (leer/escribir el libro Excel y los adjuntos en OneDrive)
   - Define `BOOTSTRAP_ADMIN_EMAIL` con tu correo corporativo: tu primer login
     te asigna el rol ADMINISTRATIVO automáticamente.
   - `ONEDRIVE_SERVICE_UPN` / `MAIL_SENDER_UPN`: el correo de la cuenta de
     servicio cuyo OneDrive aloja el libro Excel y desde la que se envían los correos.
   - Mientras configuras Azure, deja `DEV_AUTH_BYPASS=true` para entrar con
     usuarios simulados desde la pantalla de login ("Acceso de desarrollo").
     Ponlo en `false` antes de pasar a producción.
3. Crea el libro Excel inicial en OneDrive (una sola vez; requiere que
   `Files.ReadWrite.All` ya tenga consentimiento de administrador):
   ```
   cd server
   npm run init-workbook
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
- **APROBADOR**: primer visto bueno de las solicitudes (antes de contable).
- **CONTABLE**: da visto bueno contable en solicitudes y firma legalizaciones.
- **ADMINISTRATIVO**: da visto bueno administrativo final, administra el
  catálogo de proyectos/unidades de negocio y asigna roles a los usuarios
  (menú "Usuarios y Roles").

Los usuarios se crean automáticamente la primera vez que inician sesión con
Microsoft; un ADMINISTRATIVO les asigna el rol correspondiente. También existe
un acceso de administrador local (usuario/contraseña definidos en
`ADMIN_LOCAL_USERNAME`/`ADMIN_LOCAL_PASSWORD_HASH`) independiente de Microsoft,
para gestión de emergencia.

## Exportación

Cada solicitud, legalización e informe de viaje se puede exportar a PDF
(con la firma-imagen de quien haya firmado/aprobado, y espacio para firma
manuscrita donde aún falte) y a Excel desde su página de detalle.
