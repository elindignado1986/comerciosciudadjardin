# Arquitectura

Next.js App Router, React, TypeScript, Tailwind CSS y CSS propio. MapLibre se carga en cliente de forma diferida. Formularios con estado React y validación Zod compartida. Supabase aloja PostgreSQL/PostGIS, OAuth y Storage privado.

## Separación

`lib/map/layers/` contiene baseLayer, boundaryLayer, businessLayer, illustratedLayer y vegetationLayer. `lib/geocoding/` define proveedores intercambiables. `lib/supabase/server.ts` está marcado server-only: `publicDb` y `sessionDb` usan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `serviceDb` usa exclusivamente `SUPABASE_SECRET_KEY`. El proxy de sesión usa la publishable key. `lib/auth/admin.ts` valida usuario con Supabase y comprueba `admin_users` en cada operación protegida.

## Flujo público

Georef → sugerencia → selección/ajuste sobre el mapa → consentimiento → CAPTCHA → rate limit persistente → Zod + point-in-polygon → procesamiento privado de imagen → INSERT PENDING → validación PostGIS y auditoría. Los endpoints no aceptan columnas arbitrarias del cliente.

Una propuesta aprobada mediante RPC se bloquea con FOR UPDATE y crea el comercio y actualiza el estado en una sola transacción. Dos revisores no pueden publicar dos veces la misma propuesta.

## Lecturas públicas

`public_businesses` es una proyección SQL deliberada de columnas públicas. Las tablas base, fotos, remitentes e historial no se leen como usuario público. La categoría se devuelve para filtrar el mapa, pero no se selecciona ni renderiza en la ficha individual. Pendientes y rechazados viven en otra tabla.

## Seguridad

Escrituras públicas exclusivamente vía API propia: evita que una inserción directa a Supabase eluda CAPTCHA/rate limit. La secret key nunca sale del servidor; permite operar con el rol PostgreSQL `service_role`. Para admin se utiliza la publishable key con sesión autenticada y RLS, conservando `auth.uid()` en auditoría. APIs de mutación comprueban Origin contra APP_URL. Contenido se muestra como texto React, nunca HTML crudo. Las fotos usan una ruta autenticada con Cache-Control private/no-store.

El navegador no instancia clientes Supabase: consume las APIs propias. Submissions, reportes, Storage privado, rate limiting y archivos QR acceden a la secret key solo a través de `serviceDb`. El importador Node.js privado lee `SUPABASE_SECRET_KEY` del entorno y no pertenece al grafo de imports de la UI. El panel de configuración expone únicamente un booleano de presencia, nunca el valor de la clave.

La IP se convierte en hash con salt; no se guarda en claro. En Vercel se usa su encabezado de origen, y fuera de Vercel se requiere un proxy de confianza que reemplace X-Forwarded-For. El límite persiste en PostgreSQL entre instancias. Si faltan servicios de protección, las escrituras fallan cerradas.

## Límites de esta versión

Listado público máximo 5000 comercios; antes de superar ese volumen introducir consulta por viewport/clusters. Panel con páginas de 50 registros. No hay votos, pagos, comentarios públicos ni autoadhesión. La responsabilidad editorial queda en el equipo administrador. No hay envío de emails ni notificaciones externas.

Los archivos de esquema y utilidades pertenecen a la raíz pedida; no se creó una raíz anidada. No se realizaron commits ni push.
