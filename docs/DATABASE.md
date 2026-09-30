# Base de datos

Aplicar todas las migraciones ordenadas por nombre. El esquema necesita PostGIS y pgcrypto (disponibles en Supabase). El límite se carga en `app_boundary` mediante la migración generada.

| Tabla                | Propósito                                                           |
| -------------------- | ------------------------------------------------------------------- |
| businesses           | Comercios aprobados, UUID, código permanente, adhesión y estado QR  |
| business_submissions | Propuestas PENDING/APPROVED/REJECTED y datos privados del remitente |
| business_categories  | Catálogo                                                            |
| business_reports     | Reportes OPEN/RESOLVED                                              |
| business_history     | Registro privado de cambios antes/después y actor                   |
| qr_codes             | Archivo PNG, URL y nombre único por comercio                        |
| admin_users          | UUID de usuarios autorizados; solo mantenimiento privilegiado       |
| app_boundary         | Geometría validada PostGIS                                          |
| rate_limits          | Contadores persistentes por hash y vencimiento                      |

## Invariantes

- `ST_Covers` valida todos los INSERT/UPDATE de comercios y propuestas, incluso el rol `service_role` usado por la secret key y las importaciones. Si no se cargó el límite, ninguna ubicación pasa.
- Generación CJ mediante secuencia PostgreSQL no transaccional; puede haber huecos pero nunca reutilización. Se conserva el número completo a partir de CJ-10000.
- Aprobación atómica con bloqueo de fila e is_admin. UUID y código no se modifican. Baja lógica conserva historial y QR revocado.
- Revocación irreversible por trigger, incluso fuera de la UI.
- Historial generado por triggers; RLS solo lectura para administradores. Sin políticas para modificación/borrado de auditoría desde sesión normal.

## Matriz RLS

| Recurso                                 | Anónimo               | Usuario autenticado no admin | Admin                        |
| --------------------------------------- | --------------------- | ---------------------------- | ---------------------------- |
| public_businesses                       | Lectura de proyección | Igual                        | Igual                        |
| businesses/submissions/reports/qr_codes | Sin acceso directo    | Sin filas                    | SELECT/INSERT/UPDATE         |
| history                                 | No                    | No                           | SELECT                       |
| admin_users                             | No                    | Solo su propia fila          | Solo su propia fila          |
| app_boundary/rate_limits                | No                    | No                           | Solo funciones privilegiadas |
| storage evidence/qr-codes               | No                    | No                           | Lectura privada              |

La API pública crea proposals/reports en el servidor con `SUPABASE_SECRET_KEY` (rol `service_role`) después de validar CAPTCHA y límites. No se concede una policy INSERT a `anon`: evitaría por completo estas protecciones. Buckets privados con MIME y peso restringidos, además de validación en el servidor.

La migración de API keys no modifica las políticas: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` usa `anon` sin sesión y `authenticated` con JWT de usuario; `SUPABASE_SECRET_KEY` usa `service_role`. Estos nombres de roles SQL siguen vigentes y no deben reemplazarse por nombres de claves.

Auditoría incluye los valores privados porque solo es visible a administradores. Definir una política organizativa de conservación antes de recibir datos reales; eliminar un comercio es una baja lógica, no una purga de datos personales.

Backup/restore: habilitar backups en el plan Supabase y ensayar restauraciones. No distribuir la secret key ni usarla en herramientas públicas. Las tareas de mantenimiento con rol propietario pueden eludir RLS por diseño.
