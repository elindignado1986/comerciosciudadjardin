# Verificación de la primera implementación

Fecha: 2026-09-30. Entorno Windows, Node 24.15.0, Next.js 16.3.7. Resultado final: **21 pruebas aprobadas**, lint y build correctos.

## Verificado

- TypeScript sin errores y ESLint sin advertencias.
- Build de producción Next.js con todas las rutas.
- Pruebas unitarias de geometría válida y copia GeoJSON consistente, Wernicke interior, CABA exterior, coordenadas invertidas/NaN, códigos, filenames y payloads.
- Migraciones ejecutadas completas en PostgreSQL WASM con PostGIS (PGlite), con schemas auth/storage mínimos para reproducir roles de Supabase. Se prueba RLS real; no son mocks de consultas.
- Anónimo sin acceso privado, escritura directa bloqueada, usuario autenticado no admin rechazado, admin autorizado, aprobación una sola vez, código CJ-0001, cambios de coordenadas externos rechazados en DB, proyección pública sin columnas sensibles, revocación irreversible, identidad inmutable, baja lógica sin reutilizar código, rate limit persistente.
- Fotos JPEG reales convertidas a WebP, reducción a 1600 px y eliminación de EXIF. Rechazo de MIME falsificado, SVG y tamaño excesivo.
- Origen de solicitudes, lectura JSON/multipart y límites efectivos de bytes sin depender de Content-Length.
- HTTP local: home, formulario, admin sin configurar, información, términos y verificación sin DB responden sin errores internos. API pública vacía sin negocios inventados. Mutación desde otro origen: 403. Escrituras sin servicios: bloqueadas.
- Consulta desde API local para Wernicke 2236 devuelve coordenadas Georef interiores.
- Auditoría npm: cero vulnerabilidades tras corregir transitivas xmldom y uuid.

## Límites de verificación

No se proporcionaron credenciales Supabase, Google OAuth ni Turnstile. No se ensayó contra un proyecto cloud real la sesión Google, challenge CAPTCHA, subida/descarga de Storage ni impresión/escaneo físico. Las migraciones y permisos se probaron en base aislada; repetir el smoke test de README después de configurar servicios.

La herramienta de navegador de esta sesión informó que no hay navegadores disponibles. No se completó inspección visual ni interacción táctil real a 360–430 px. La UI incluye media queries, controles táctiles y ficha móvil superpuesta; falta comprobar su apariencia en un navegador/dispositivo real.

No se creó un repositorio Git, no hubo commits, no hubo push ni deploy. Todo el código y los artefactos del proyecto permanecen bajo E:\mapacomerciosciudadjardin.
