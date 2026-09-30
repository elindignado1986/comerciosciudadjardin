# Vercel / Supabase

1. Aplicar migraciones al proyecto Supabase; comprobar app_boundary no vacío.
2. Configurar Google OAuth, lista admin, Turnstile y variables descritas en README. Obtener las API keys actuales de Supabase: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) y `SUPABASE_SECRET_KEY` (`sb_secret_...`).
3. Importar esta raíz como proyecto Next.js en Vercel. Install `npm ci`, build `npm run build`. No definir una subcarpeta raíz.
4. Añadir variables para Production y Preview según corresponda. No usar el dominio productivo como APP_URL de un preview que deba aceptar formularios: cada origen tiene configuración exacta propia.
5. Autorizar dominio final en OAuth, Turnstile y proveedor cartográfico. Elegir APP_URL estable antes de generar QR impresos.
6. Ejecutar smoke test con un comercio real autorizado, confirmar pendiente invisible, aprobación, QR, suspensión/revocación y reporte. No cargar comercios demo en producción.

No se hizo deploy, commit ni push en esta implementación. No se envían mensajes a terceros.

## Fotos

Límite de aplicación 8 MB en desarrollo. Vercel puede imponer un límite de request menor (habitualmente alrededor de 4.5 MB para Functions): verificar el plan y preferir fotos menores a 4 MB en ese hosting. Para soportar 8 MB completos en cualquier plan, cambiar a carga firmada a bucket de cuarentena y procesamiento posterior privado antes de promover la evidencia. Nunca habilitar acceso público a evidence.

## Operación

Georef y tiles requieren conectividad externa. El fallback manual no depende del geocoder, aunque sí de cargar la cartografía para ubicar visualmente el pin. OpenFreeMap predeterminado no requiere clave; para necesidades de SLA/configuración visual propias usar proveedor contratado. Configurar Photon productivo solo si hay capacidad/condiciones adecuadas; no usar Nominatim como autocomplete.

Proteger `SUPABASE_SECRET_KEY`: variable exclusiva del servidor, sin prefijo NEXT_PUBLIC y sin exposición en next.config, props ni respuestas. Mantener `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` para las lecturas públicas y sesiones sujetas a RLS. Los roles SQL `anon`, `authenticated` y `service_role` no cambian. En despliegues existentes, quitar las variables anteriores, cargar las nuevas claves y reconstruir/reiniciar. No se requiere una migración SQL por este cambio.

Configurar salt aleatorio persistente. En hosting propio, reemplazar encabezados de IP en el reverse proxy; no confiar en encabezados enviados por clientes. El acceso público nunca habilita administración, ni aun con una cuenta Google válida.
