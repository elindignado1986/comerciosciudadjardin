# Futura capa ilustrada

La primera versión permanece 2D. No contiene imágenes de Google Earth, Maps o Street View, ni ilustraciones finales, árboles inventados o edificios extruidos.

`lib/map/layers/illustratedLayer.ts` acepta ImageSourceSpecification o RasterSourceSpecification de MapLibre. La capa se inserta debajo de la máscara exterior y los marcadores (actualmente DOM), por lo que el límite y los comercios siguen interactivos.

Para una imagen propia:

```ts
addIllustratedLayer(
  map,
  {
    type: "image",
    url: "/illustrations/barrio.webp",
    coordinates: [
      [oesteNorteLng, oesteNorteLat], // superior izquierda
      [esteNorteLng, esteNorteLat], // superior derecha
      [esteSurLng, esteSurLat], // inferior derecha
      [oesteSurLng, oesteSurLat], // inferior izquierda
    ],
  },
  0.85,
);
```

Los cuatro puntos son coordenadas WGS84 reales de control, en orden horario. No basta con dibujar un PNG aproximado: verificar ajuste con calles/plazas antes de habilitarlo. Para superficies grandes, georreferenciar en QGIS, exportar tiles XYZ en Web Mercator y utilizar RasterSource con tiles, tileSize y límites de zoom.

Pendiente para esa etapa: producir ilustraciones propias/autorizadas, definir puntos de control, revisar alineación, preparar versiones por zoom, optimizar peso y alojar assets. Agregar selector de opacidad/capa cuando existan imágenes. `vegetationLayer` admite puntos de árboles cuando haya una fuente real; no se agrega ninguna capa compleja ahora.
