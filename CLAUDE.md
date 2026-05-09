# SW-APP_TEMP_BLOWER_CONTROLLER-MQTT-v0.0.0-DEV

PWA estática para control remoto de blower con temperatura vía MQTT. Sin build tools.

## Stack
- HTML / CSS / JS puro
- MQTT.js v5.3.5 (CDN: unpkg)
- Broker: HiveMQ público — `broker.hivemq.com:8884` (WSS)

## Topics MQTT
| Dirección           | Topic                                    | Payload                                      |
|---------------------|------------------------------------------|----------------------------------------------|
| Dispositivo → App   | `blower/ctrl/BLOWER-CTRL-001/telemetry`  | `{"temp":23.5,"speed":2,"mode":"auto"}`      |
| App → Dispositivo   | `blower/ctrl/BLOWER-CTRL-001/command`    | `{"speed":3,"mode":"manual"}` o `{"mode":"auto"}` |

## Estructura
```
index.html          interfaz principal
app.js              lógica MQTT + UI
styles.css          estilos (dark, naranja)
manifest.json       configuración PWA
service-worker.js   caché offline (cache-first)
crear-iconos.html   genera icon-192.png e icon-512.png via canvas
.claude/            contexto Claude + skills
docs/               documentación
```

## Correr localmente
```
npx serve .
# o
python -m http.server 8080
```
El service worker requiere HTTP o HTTPS, no funciona con `file://`.

## Notas
- Device ID configurable en `app.js` → constante `DEVICE.id`
- Modo Auto: app solo recibe telemetría, no publica velocidad
- Modo Manual: slider activo, publica `command` en cada cambio
- Mensajes perdidos no son falla crítica (QoS 0)
- Reconexión automática cada 5 s
