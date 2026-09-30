# Placas y QR

Cada comercio aprobado obtiene `CJ-0001` mediante secuencia DB, con UUID independiente. `/v/CJ-0001` es permanente; la URL no contiene estado ni nombre.

Generar QR desde la ficha de administración. Se crea PNG de 1000 px, margen 4 módulos, corrección M y alto contraste. El nombre normaliza acentos y elimina caracteres peligrosos: `nombre_direccion.png`. Si ya existe ese nombre para otro comercio, agrega `_CJ-XXXX`.

Storage privado: bucket `qr-codes`, ruta `CJ-0001/nombre_direccion.png`. Tabla qr_codes registra URL, path y filename. La descarga requiere sesión admin. En desarrollo se guarda también una copia en `generated/qr/`, ignorada por Git. Producción usa Storage, nunca el filesystem efímero de Vercel.

Una generación repetida devuelve el archivo existente para mantener la placa emitida, aunque después cambien nombre o dirección. El dominio elegido en APP_URL debe ser estable. Si cambia, conservar redirecciones del dominio anterior: ningún QR impreso puede cambiar su URL física.

Suspender: mensaje temporal, marcador neutro. Revocar: “Esta placa ya no acredita una adhesión vigente”; no puede reactivarse. Baja lógica: la ficha deja de publicarse y no acredita una adhesión. El código y la auditoría se conservan. Sin adhesión nunca muestra el sello de adhesión verificada aunque el registro QR esté ACTIVE.

Escanear un QR consulta el estado actual sin caché estática. Las fotos/evidencias/categoría/remitente/email no aparecen en esa página. Se ofrece reporte FAKE_OR_MISPLACED_QR.
