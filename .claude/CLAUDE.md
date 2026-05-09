# Contexto extendido — Blower Controller

## Device ID
`BLOWER-CTRL-001` — cambiar en `app.js` → `DEVICE.id` para múltiples unidades.
El topic se construye dinámicamente: `blower/ctrl/${DEVICE.id}/telemetry`.

## Lógica de modo
- **Auto**: slider deshabilitado. App recibe telemetría y muestra velocidad del dispositivo.
  Publica `{"mode":"auto"}` al cambiar.
- **Manual**: slider activo (OFF, 1, 2, 3, 4). Cada selección publica inmediatamente
  `{"speed": N, "mode":"manual"}`. La velocidad en pantalla sigue siendo la del telemetría.

## Payload esperado del dispositivo
```json
{ "temp": 23.5, "speed": 2, "mode": "auto" }
```
- `temp`: float, 1 decimal en pantalla
- `speed`: int 0–4 (0 = apagado)
- `mode`: `"auto"` | `"manual"` (informativo, la app no lo usa para cambiar su propio estado)

## Iconos
1. Abrir `crear-iconos.html` en navegador
2. Descargar `icon-192.png` e `icon-512.png`
3. Colocar en raíz del proyecto

## Broker de prueba
HiveMQ público no requiere autenticación. Para pruebas usar cualquier cliente MQTT
(MQTT Explorer, mosquitto_pub) publicando al topic de telemetría.

## Archivos clave
| Archivo | Responsabilidad |
|---------|----------------|
| `app.js:1-10` | Constantes MQTT y topics |
| `app.js:32-70` | Ciclo de vida MQTT |
| `app.js:73-110` | Funciones UI (modo, velocidad, status) |
| `styles.css:1-12` | Variables CSS (paleta) |
