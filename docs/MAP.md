# Mapa y direcciones

## Fuente geográfica

Relación OSM 2442850, nombre verificado “Ciudad Jardín Lomas del Palomar”. Descarga inicial: **2026-09-30**, fuente https://www.openstreetmap.org/api/0.6/relation/2442850/full.json. Conversión completa con osmtogeojson, validación Turf y guardado de un Polygon. `properties` del GeoJSON contiene instante preciso, etiquetas OSM, URL y licencia ODbL 1.0.

Se importa una copia JSON generada idéntica para TypeScript. El frontend y backend usan `isInsideCiudadJardin`; el servidor de base de datos aplica la misma geometría con PostGIS. Puntos sobre el borde se consideran dentro tanto con Turf como con ST_Covers. El boundary no se descarga desde OSM en cada visita.

## Cartografía

MapLibre, pitch cero, rotación desactivada, sin extrusiones. Estilo vectorial configurable por NEXT_PUBLIC_MAP_STYLE_URL y NEXT_PUBLIC_TILE_PROVIDER_KEY. Por defecto: OpenFreeMap Liberty. Se ocultan POI y alturas y se ajustan verdes/fondos; se conserva jerarquía por zoom del proveedor. Fuera del límite se coloca una máscara clara con 85% de opacidad. AttributionControl permanece visible.

El marcador de selección se puede arrastrar; un movimiento fuera del límite se revierte y muestra el mensaje explícito. No se crean negocios automáticamente a partir del mapa base. Selección por toque y pan/pinch nativos de MapLibre.

## Geocoding

Documentación consultada: https://www.argentina.gob.ar/georef/normalizacion-de-direcciones y https://www.argentina.gob.ar/datos-abiertos/georef/openapi.

Georef v2.0 `/direcciones`, provincia 06, departamento Tres de Febrero; `/calles` para sugerencias de nomenclatura sin coordenadas; `/ubicacion` disponible en el proveedor reverse. El filtrado final siempre se hace por polígono, no solo por el nombre de la localidad.

Consulta real inicial `Wernicke 2236` devolvió **AV WERNICKE 2236, Ciudad Jardín Lomas del Palomar**, latitud -34.592576043142856, longitud -58.590959175959185. No se trata de un comercio precargado: es un caso de prueba de dirección.

Photon funciona como fallback opcional. En desarrollo se puede usar el servicio público con búsquedas explícitas, sin autocomplete intensivo; en producción configurar endpoint propio/contratado. Si un geocoder no responde, la selección manual continúa disponible. No se inventa un nivel de confianza cuando la fuente no lo informa.

Los resultados externos permanecen identificados como fuera del barrio y no se pueden seleccionar. Nunca se persiste contenido de Google; el enlace de administración abre una búsqueda externa.
