// ── Config ─────────────────────────────────────────────────────────────────
const MQTT_CONFIG = {
  broker: 'broker.hivemq.com',
  port: 8884,
  path: '/mqtt'
}

const DEVICE = { id: 'BLOWER-CTRL-001' }

const TOPICS = {
  telemetry: `blower/ctrl/${DEVICE.id}/telemetry`,
  command:   `blower/ctrl/${DEVICE.id}/command`
}

// ── State ───────────────────────────────────────────────────────────────────
let client = null
let isConnected = false
let currentMode = 'auto'
let selectedSpeed = 0

// ── DOM refs ────────────────────────────────────────────────────────────────
const dom = {
  statusDot:     document.getElementById('statusDot'),
  statusText:    document.getElementById('statusText'),
  tempValue:     document.getElementById('tempValue'),
  speedBadge:    document.getElementById('speedBadge'),
  btnAuto:       document.getElementById('btnAuto'),
  btnManual:     document.getElementById('btnManual'),
  sliderWrapper: document.getElementById('sliderWrapper'),
  sliderFill:    document.getElementById('sliderFill'),
  connectBtn:    document.getElementById('connectBtn'),
  installPrompt: document.getElementById('installPrompt'),
  installBtn:    document.getElementById('installBtn')
}

// ── MQTT ────────────────────────────────────────────────────────────────────
function connectMQTT() {
  if (client) disconnectMQTT()

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${MQTT_CONFIG.broker}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`
  const clientId = `blower-app-${Math.random().toString(16).slice(2, 8)}`

  client = mqtt.connect(url, {
    clientId,
    reconnectPeriod: 5000,
    connectTimeout:  10000,
    keepalive: 60
  })

  client.on('connect', () => {
    client.subscribe(TOPICS.telemetry, { qos: 0 })
    updateStatus(true)
  })

  client.on('message', (_topic, payload) => {
    try {
      const data = JSON.parse(payload.toString())
      if (data.temp !== undefined) {
        dom.tempValue.textContent = parseFloat(data.temp).toFixed(1)
      }
      if (data.speed !== undefined) {
        dom.speedBadge.textContent = data.speed === 0 ? 'OFF' : String(data.speed)
      }
    } catch (_) { /* malformed — ignore */ }
  })

  client.on('disconnect', () => updateStatus(false))
  client.on('offline',    () => updateStatus(false))
  client.on('error',      () => updateStatus(false))
}

function disconnectMQTT() {
  if (client) {
    client.end(true)
    client = null
  }
  updateStatus(false)
}

function toggleConnect() {
  isConnected ? disconnectMQTT() : connectMQTT()
}

function publishCommand(payload) {
  if (!isConnected || !client) return
  client.publish(TOPICS.command, JSON.stringify(payload), { qos: 0 })
}

// ── UI ──────────────────────────────────────────────────────────────────────
function updateStatus(connected) {
  isConnected = connected
  dom.statusDot.className  = 'status-dot' + (connected ? ' connected' : '')
  dom.statusText.textContent = connected ? 'Conectado' : 'Desconectado'
  dom.connectBtn.textContent = connected ? 'Desconectar' : 'Conectar'
  dom.connectBtn.className   = 'connect-btn' + (connected ? ' connected' : '')
}

function setMode(mode) {
  currentMode = mode
  dom.btnAuto.className   = 'mode-btn' + (mode === 'auto'   ? ' active' : '')
  dom.btnManual.className = 'mode-btn' + (mode === 'manual' ? ' active' : '')
  dom.sliderWrapper.className = 'slider-wrapper' + (mode === 'auto' ? ' disabled' : '')

  if (mode === 'auto') {
    publishCommand({ mode: 'auto' })
  }
}

function setSpeed(level) {
  selectedSpeed = level
  updateSliderUI(level)
  publishCommand({ speed: level, mode: 'manual' })
}

function updateSliderUI(level) {
  document.querySelectorAll('.step').forEach((s, i) => {
    s.className = 'step' + (i === level ? ' active' : '')
  })
  dom.sliderFill.style.width = `${(level / 4) * 100}%`
}

// ── PWA install ─────────────────────────────────────────────────────────────
let deferredInstallPrompt = null

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  deferredInstallPrompt = e
  dom.installPrompt.style.display = 'block'
})

dom.installBtn.addEventListener('click', () => {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  deferredInstallPrompt.userChoice.then(() => {
    deferredInstallPrompt = null
    dom.installPrompt.style.display = 'none'
  })
})

// ── Init ────────────────────────────────────────────────────────────────────
updateSliderUI(0)
setMode('auto')
