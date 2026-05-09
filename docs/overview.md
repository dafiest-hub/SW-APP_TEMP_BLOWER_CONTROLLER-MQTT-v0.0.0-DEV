# SW-APP_TEMP_BLOWER_CONTROLLER-MQTT

PWA para control de blower vía MQTT. Desplegable en GitHub Pages (estática).

## Arquitectura

```
[Dispositivo físico] ──MQTT publish──► [HiveMQ broker] ──MQTT subscribe──► [PWA]
[PWA] ──MQTT publish──► [HiveMQ broker] ──MQTT subscribe──► [Dispositivo físico]
```

## Topics

| Topic | Dirección | Payload |
|-------|-----------|---------|
| `blower/ctrl/BLOWER-CTRL-001/telemetry` | Dispositivo → App | `{"temp":23.5,"speed":2,"mode":"auto"}` |
| `blower/ctrl/BLOWER-CTRL-001/command`   | App → Dispositivo | `{"speed":3,"mode":"manual"}` |

## Correr

```bash
npx serve .           # requiere Node
python -m http.server # requiere Python
```
Abrir en `http://localhost:PORT` — el service worker no funciona en `file://`.

## Iconos (primer uso)

1. Abrir `crear-iconos.html` en navegador
2. Descargar ambos PNG y colocarlos en raíz del proyecto

## Broker

HiveMQ público — `broker.hivemq.com:8884` (WSS). Sin autenticación. Para producción usar broker privado.

## Variables de configuración (`app.js`)

| Constante | Valor por defecto | Descripción |
|-----------|------------------|-------------|
| `MQTT_CONFIG.broker` | `broker.hivemq.com` | Host del broker |
| `MQTT_CONFIG.port` | `8884` | Puerto WSS |
| `DEVICE.id` | `BLOWER-CTRL-001` | ID único del dispositivo |
