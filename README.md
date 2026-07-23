# Diana & Erick · RSVP

Invitación web de una sola boda para Diana y Erick, del 9 al 11 de abril de 2027. El sitio público está en español y permite confirmar asistencia para cada día. El panel privado permite administrar respuestas, contenido, eventos, disponibilidad del RSVP y exportaciones de Excel.

## Stack

- Next.js 16 con App Router y TypeScript estricto.
- Tailwind CSS 4 para el runtime de estilos base y CSS de diseño editorial.
- Drizzle ORM con `@libsql/client`.
- SQLite/libSQL local durante el desarrollo y Turso/libSQL en producción.
- Zod, `bcryptjs`, `jose` y `xlsx`.

## Requisitos

- Node.js compatible con Next.js 16.
- npm.
- Una base Turso/libSQL para producción.

## Instalación local

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local`. Los valores de ejemplo no son credenciales de producción:

```bash
TURSO_DATABASE_URL="file:local.db"
TURSO_AUTH_TOKEN=""
AUTH_SECRET="reemplaza-con-al-menos-32-caracteres-aleatorios"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="reemplaza-esta-contrasena"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
WA_SENDER_API_KEY=""
WA_SENDER_WEBHOOK_SECRET="reemplaza-por-un-secreto-unico"
CRON_SECRET="reemplaza-por-un-secreto-unico"
```

La URL `file:local.db` solo debe utilizarse durante el desarrollo. En Vercel se debe utilizar una URL `libsql://...` de Turso y su token.

## Base de datos

Generar una migración después de cambios de esquema:

```bash
npm run db:generate
```

Aplicar migraciones:

```bash
npm run db:migrate
```

Para una instalación local rápida también se puede usar:

```bash
npm run db:push
```

Crear o actualizar la configuración inicial, los tres eventos y el único administrador:

```bash
npm run db:seed
```

El seed usa `ADMIN_PASSWORD_HASH` si existe; de lo contrario hashea `ADMIN_PASSWORD`. Nunca imprime la contraseña. El seed es idempotente y actualiza el administrador por correo.

## Desarrollo y producción

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

Para producción, configura deliberadamente estas variables en Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `AUTH_SECRET` de al menos 32 caracteres
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` o `ADMIN_PASSWORD_HASH`
- `NEXT_PUBLIC_SITE_URL`
- `WA_SENDER_API_KEY`
- `WA_SENDER_WEBHOOK_SECRET`
- `CRON_SECRET`

Después de crear la base Turso, ejecuta migraciones y seed contra esa base desde un entorno con acceso a Turso:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:migrate
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
```

No se ejecutan migraciones ni seed automáticamente en cada request de Vercel. Despliega el proyecto después de completar esas operaciones.

## Rutas principales

- `/` — invitación pública para personas invitadas a los tres eventos.
- `/sabado` — invitación para personas invitadas únicamente al sábado; solo muestra el evento y RSVP del sábado.
- `/admin/login` — acceso del administrador.
- `/admin` — resumen y respuestas recientes.
- `/admin/responses` — búsqueda, filtros, paginación y exportación.
- `/admin/responses/new` — agregar respuesta manual.
- `/admin/responses/[id]` — ver, editar o eliminar una respuesta.
- `/admin/whatsapp` — importar invitados, revisar envíos y reintentar errores.
- `/admin/content` — editar textos públicos.
- `/admin/events` — editar los tres eventos.
- `/admin/settings` — SEO y apertura/cierre de confirmaciones.
- `/api/admin/responses/export` — exportación protegida `.xlsx`.
- `/api/cron/whatsapp` — worker protegido que procesa la cola de WhatsApp.
- `/api/whatsapp/webhook` — actualiza el estado enviado/entregado/leído desde WA Sender.

## Invitaciones por WhatsApp

En `/admin/whatsapp`, importa la primera hoja de un archivo `.xlsx`, `.xls` o `.csv`. Se valida antes de agregar cualquier persona a la cola. Las columnas requeridas son:

- `name`
- `prefix` — código de país, por ejemplo `+591`.
- `phone_number` — teléfono nacional sin el prefijo.
- `solo_invitado_sabado` — `true`/`false`, `sí`/`no`, `1`/`0` o `x`.

`custom_message` es opcional. Puede usar `{name}` y `{link}`; si está vacío se usa el mensaje predeterminado. Los teléfonos repetidos dentro del archivo impiden la importación; las personas que ya existen en la base se omiten para evitar reenvíos accidentales.

Cada fila recibe una URL opaca y única bajo `/invitacion/...`. Estas son copias personales de `/` o `/sabado`, según `solo_invitado_sabado`; mantienen las rutas originales anónimas y rellenan el nombre al confirmar. El panel registra la primera apertura del enlace y los estados de WhatsApp.

### WA Sender + Vercel

El worker se ejecuta por Vercel Cron cada minuto, procesa hasta cuatro mensajes secuencialmente y espera cinco segundos entre cada solicitud. Esto coincide con el modo de protección de cuenta de WA Sender y evita un proceso permanente en Vercel.

Después de desplegar:

1. Configura las tres variables de WhatsApp indicadas arriba en Vercel.
2. En la sesión de WA Sender, configura `https://TU_DOMINIO/api/whatsapp/webhook` como **Webhook URL**, guarda el mismo valor de `WA_SENDER_WEBHOOK_SECRET` como **Webhook Secret**, y activa `messages.update`.
3. Conserva `vercel.json`; su cron llama a `/api/cron/whatsapp` y Vercel lo autentica con `CRON_SECRET`.
4. Asegúrate de que tu plan de Vercel permita cron cada minuto antes de cargar una lista grande.

WA Sender usa `POST /api/send-message` con `Authorization: Bearer ...` y un cuerpo `{ to, text }`; sus eventos `messages.update` actualizan los estados del panel. Consulta la [documentación de envío](https://api.wasenderapi.com/api-docs/messages/send-text-message) y la [configuración de webhooks](https://wasenderapi.com/api-docs/webhooks/webhook-setup) si cambias la sesión o las credenciales.

## Imágenes

Las imágenes activas están en `public/images/`. Los originales y variantes que no usa la aplicación están archivados en `public/images/unused/` para mantenerlos disponibles sin mezclarlos con los assets de producción.

No existe carga de imágenes desde el panel.

## Exportación y modelo de respuestas

El Excel incluye las hojas `RESPUESTAS` y `RESUMEN`, valores `Sí`/`No`/`Tal vez`, origen, fechas en español y respeta los filtros actuales cuando se exportan respuestas filtradas.

Una fila de la base representa un envío del campo de nombre. El sistema no intenta interpretar ni separar acompañantes escritos como “Nombre + acompañante”. Se permiten nombres duplicados y envíos duplicados. No se colecta información de contacto, correo, teléfono, cantidad de invitados o estado indeciso.

Las respuestas enviadas desde `/sabado` se guardan automáticamente con `attendsSaturday` según la selección del invitado y `attendsFriday = "no"` y `attendsSunday = "no"`. La regla también se aplica en el endpoint del servidor, no solo en la interfaz.

## Limitaciones intencionales

- No hay edición pública de una respuesta.
- No hay correos, SMS ni recordatorios automáticos fuera de la cola de WhatsApp.
- No hay registro público, roles, múltiples administradores ni recuperación de contraseña.
- No hay carga de imágenes ni editor HTML.
- La fecha límite es informativa; el administrador controla manualmente si el RSVP está abierto.

## Checklist de despliegue

1. Crear la base de datos Turso.
2. Configurar las variables de entorno de producción en Vercel.
3. Ejecutar `db:migrate` contra Turso.
4. Ejecutar `db:seed` contra Turso.
5. Ejecutar `npm run lint`, `npm run typecheck` y `npm run build`.
6. Reemplazar los placeholders en `public/images/` si ya están disponibles.
7. Ingresar a `/admin/login` y comprobar el formulario, el cierre de RSVP y la exportación.
