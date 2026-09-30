# Comercios comprometidos con Ciudad Jardín

Mapa colaborativo 2D, exclusivamente para Ciudad Jardín Lomas del Palomar, Tres de Febrero, Buenos Aires. Proyecto raíz: `E:\mapacomerciosciudadjardin`. No contiene comercios inventados ni importaciones automáticas de POI.

## Inicio local

Requiere Node.js 22.13 o posterior (verificado con Node 24).

```powershell
cd E:\mapacomerciosciudadjardin
npm install
Copy-Item .env.example .env.local
npm run dev
```

En PowerShell con scripts deshabilitados, usar `npm.cmd` en lugar de `npm`. Abrir http://localhost:3000. Usar ese mismo host para los formularios y OAuth; la protección de origen compara con `NEXT_PUBLIC_APP_URL`.

**Sin credenciales** funcionan la navegación, el mapa, los filtros vacíos, la búsqueda Georef, la selección y validación geográfica, y la interfaz del formulario. Los envíos y la administración requieren los servicios configurados. No existe modo de administrador falso ni un bypass de CAPTCHA.

## Configuración externa necesaria

El worker de MapLibre y su módulo compartido se copian desde la dependencia instalada a `public/maplibre/` automáticamente antes de `npm run dev` y `npm run build`. Estos archivos generados no se versionan. El mapa usa una URL local explícita para que Next.js pueda servir ambos módulos correctamente.

1. Crear un proyecto Supabase. En Settings → API Keys obtener la publishable key (`sb_publishable_...`) y la secret key (`sb_secret_...`). Copiar URL y ambas claves en `.env.local` usando los nombres de `.env.example`.
2. Ejecutar los SQL de `supabase/migrations/` en orden por nombre, primero esquema y después boundary, mediante SQL Editor o Supabase CLI. La geometría viene incluida: no hay que dibujar límites a mano.
3. Habilitar Google en Supabase Auth. En Google Cloud, crear OAuth client de tipo Web, configurar pantalla de consentimiento, usuarios de prueba si corresponde y callback `https://PROJECT_REF.supabase.co/auth/v1/callback`. Pegar client ID y secret en Supabase, nunca en el navegador de esta aplicación.
4. En Supabase Auth URL Configuration, definir Site URL y permitir `http://localhost:3000/auth/callback` y `https://TU_DOMINIO/auth/callback`.
5. Ingresar una vez desde `/admin` con Google. Dar de alta el UUID de esa cuenta en SQL Editor:

```sql
insert into public.admin_users(user_id) values ('UUID_DE_AUTH_USERS');
```

Solo una cuenta presente en `admin_users` puede administrar. Un login Google exitoso no concede permisos por sí mismo.

6. Crear widget Cloudflare Turnstile y autorizar `localhost` y el dominio final. Completar sus dos claves.
7. Definir `RATE_LIMIT_SALT` con un valor aleatorio largo y `NEXT_PUBLIC_APP_URL` con el dominio definitivo antes de emitir placas.
8. Para producción, elegir/configurar proveedor de estilo vectorial MapLibre y sus atribuciones. El valor predeterminado usa OpenFreeMap, no servidores de tiles estándar de OSM. La clave de tiles es pública: restringir su uso por dominio en el proveedor.

| Variable                               | Uso                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL del proyecto Supabase                                                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública para lecturas públicas y sesiones de usuario, sujetas a RLS           |
| `SUPABASE_SECRET_KEY`                  | Solo servidor e importador privado: ingreso anónimo validado, rate limits y Storage |
| `NEXT_PUBLIC_APP_URL`                  | Origen exacto, OAuth y URLs permanentes de QR                                       |
| `NEXT_PUBLIC_MAP_STYLE_URL`            | Estilo MapLibre; admite `{key}`                                                     |
| `NEXT_PUBLIC_TILE_PROVIDER_KEY`        | Clave pública del proveedor cartográfico                                            |
| `TURNSTILE_SITE_KEY`                   | Clave de widget, entregada a la UI por el servidor                                  |
| `TURNSTILE_SECRET_KEY`                 | Validación CAPTCHA del servidor                                                     |
| `RATE_LIMIT_SALT`                      | Salt para hash de IP, obligatorio para escrituras y rate limit                      |
| `GEOREF_API_URL`                       | Opcional; Georef v2.0 predeterminado                                                |
| `PHOTON_API_URL`                       | Opcional; proveedor Photon propio/contratado en producción                          |

La publishable key también se usa en SSR, OAuth y el proxy de sesión: junto al JWT del usuario conserva el rol `authenticated`; sin sesión usa `anon`. La secret key usa el rol `service_role` y elude RLS, por eso se reserva a operaciones privilegiadas tras las validaciones existentes. No cambia ninguna política RLS.

No hay un cliente Supabase directo en los componentes del navegador: llaman a las rutas de esta aplicación. `lib/supabase/server.ts` mantiene `import "server-only"`; la secret key no se entrega en props, respuestas ni configuración pública. El importador es una herramienta Node.js privada y toma la clave del entorno, nunca de un valor incrustado en el código.

Para migrar un despliegue existente, configurar las dos variables nuevas en `.env.local` y Vercel, quitar las variables anteriores y reconstruir/reiniciar. No basta con renombrar un valor JWT anterior: obtener las claves nuevas en Supabase. Referencia: [API keys de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## Funciones

- Mapa crema/salvia, máscara exterior, marcadores propios, selección táctil y filtros. Sin 3D ni POI de negocios importados.
- Búsqueda por calle y altura, fallback opcional Photon y corrección manual. Georef devuelve coordenadas aproximadas; siempre confirmar la posición.
- Propuestas sin cuenta con CAPTCHA, validación Zod, rate limit persistente y revisión obligatoria.
- Fotos privadas: MIME contrastado con bytes, límites, EXIF eliminado, WebP 76%, lado largo máximo 1600 px.
- Admin con Google OAuth y lista de acceso, pendientes, edición, altas, reportes, historial, dashboard y configuración.
- Aprobación transaccional, código por secuencia DB, QR PNG permanente, suspensión/revocación y baja lógica.
- Fichas sin fotos, remitentes, emails, evidencia ni categoría. Estados suspendido/revocado se consultan en cada visita, sin caché estática.
- Reportes de información incorrecta y de placas colocadas en otro comercio.
- Importador CSV/XLSX/JSON que siempre ingresa propuestas pendientes.

## Verificación

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Los tests comprueban geometría, dentro/fuera, códigos, nombres seguros, payloads, permisos y transformaciones privadas. Ver `docs/VERIFICATION.md` para resultados y límites de las pruebas realizadas. Los flujos de Google, Storage y CAPTCHA reales requieren credenciales del propietario.

## Archivos importantes

- `lib/config.ts`: nombre, descripción, paleta, categorías y textos de reportes.
- `data/ciudad-jardin-boundary.geojson`: límite operativo OSM versionable, fecha/fuente/licencia en properties.
- `data/ciudad-jardin-boundary.json`: copia generada para importación TypeScript; no editar a mano.
- `components/map/`: mapa público, buscador y selección geográfica.
- `components/submission/`: formulario de propuestas.
- `components/admin/`, `app/admin/`: revisión, edición y gestión.
- `app/api/`: endpoints con validación y autorización.
- `supabase/migrations/`: tablas, PostGIS, políticas, triggers, auditoría, secuencia, Storage y boundary.
- `scripts/update-boundary.ts`: actualización de fuente OSM y migración SQL nueva.
- `scripts/import-businesses.ts`: validación/importación de listados.

## Actualizar límite

```powershell
npm run boundary:update
```

Consulta la relación completa 2442850, comprueba identidad y Polygon/MultiPolygon válido, guarda GeoJSON y genera nueva migración con la geometría. Revisar diferencias y aplicar la nueva migración antes de desplegar el nuevo frontend. No se consulta OSM para el límite al abrir el mapa.

## Importaciones

Columnas mínimas: `name,address_input,lat,lng,category,adhesion`. Opcionales: `address_normalized,geocoder_source,manually_adjusted,evidence`. Categorías exactas en `lib/config.ts`; adhesión `ADHERIDO` o `SIN_ADHESION`. Ubicación dentro del polígono obligatoria.

```powershell
npm run import:businesses -- data/listado.csv
# Validación; no escribe. Para aplicar (requiere variables Supabase cargadas):
node --env-file=.env.local --import tsx scripts/import-businesses.ts data/listado.xlsx --apply
```

El archivo debe estar dentro de la raíz del proyecto. Se admiten hasta 5000 filas. No se aprueba automáticamente. No se permite enviar UUID/código/estado interno desde el listado.

## Documentación

[Arquitectura](docs/ARCHITECTURE.md) · [Base de datos](docs/DATABASE.md) · [Mapa](docs/MAP.md) · [QR](docs/QR.md) · [Despliegue](docs/DEPLOYMENT.md) · [Capa ilustrada](docs/ILLUSTRATED_MAP.md).

Antes de publicar, completar la identidad y canal de contacto del responsable de la iniciativa en los términos. El branding es configurable y no determina las claves ni la arquitectura.
