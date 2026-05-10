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
let client      = null
let isConnected = false

// Last state confirmed by telemetry
let confirmedMode  = 'auto'
let confirmedSpeed = 0

// Pending command awaiting device confirmation
let pendingMode  = null   // 'auto' | 'manual' | null
let pendingSpeed = null   // 0–4 | null
let modeTimer    = null
let speedTimer   = null

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
  installBtn:    document.getElementById('installBtn'),
  toast:         document.getElementById('toast')
}

// ── Toast ───────────────────────────────────────────────────────────────────
let toastHideTimer = null

function showToast(msg) {
  dom.toast.textContent = msg
  dom.toast.classList.add('visible')
  clearTimeout(toastHideTimer)
  toastHideTimer = setTimeout(() => dom.toast.classList.remove('visible'), 3000)
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

      // Temperature always follows telemetry
      if (data.temp !== undefined) {
        dom.tempValue.textContent = parseFloat(data.temp).toFixed(1)
      }

      // Speed badge always follows telemetry; slider only if no pending
      if (data.speed !== undefined) {
        const newSpeed = Number(data.speed)
        dom.speedBadge.textContent = newSpeed === 0 ? 'OFF' : String(newSpeed)

        if (pendingSpeed !== null) {
          confirmedSpeed = newSpeed
          if (newSpeed === pendingSpeed) {
            clearTimeout(speedTimer)
            pendingSpeed = null
            speedTimer   = null
            updateSliderUI(newSpeed)
          }
          // else: keep optimistic slider position until timer fires
        } else {
          confirmedSpeed = newSpeed
          updateSliderUI(newSpeed)
        }
      }

      // Mode buttons always follow telemetry
      if (data.mode !== undefined) {
        const newMode = data.mode
        confirmedMode = newMode
        applyModeUI(newMode)

        if (pendingMode !== null && newMode === pendingMode) {
          clearTimeout(modeTimer)
          pendingMode = null
          modeTimer   = null
        }
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
  dom.statusDot.className   = 'status-dot' + (connected ? ' connected' : '')
  dom.statusText.textContent = connected ? 'Conectado' : 'Desconectado'
  dom.connectBtn.textContent = connected ? 'Desconectar' : 'Conectar'
  dom.connectBtn.className   = 'connect-btn' + (connected ? ' connected' : '')
}

function applyModeUI(mode) {
  dom.btnAuto.className   = 'mode-btn' + (mode === 'auto'   ? ' active' : '')
  dom.btnManual.className = 'mode-btn' + (mode === 'manual' ? ' active' : '')
  dom.sliderWrapper.className = 'slider-wrapper' + (mode === 'auto' ? ' disabled' : '')
}

function setMode(mode) {
  if (!isConnected) return
  if (pendingMode === mode) return
  if (pendingMode === null && confirmedMode === mode) return

  clearTimeout(modeTimer)
  publishCommand(mode === 'auto' ? { mode: 'auto' } : { mode: 'manual' })
  pendingMode = mode

  modeTimer = setTimeout(() => {
    showToast('No se pudo cambiar el modo')
    pendingMode = null
    modeTimer   = null
    applyModeUI(confirmedMode)
  }, 5000)
}

function setSpeed(level) {
  if (!isConnected) return
  if (pendingSpeed === level) return
  if (pendingSpeed === null && confirmedSpeed === level) return

  clearTimeout(speedTimer)
  updateSliderUI(level)
  publishCommand({ speed: level, mode: 'manual' })
  pendingSpeed = level

  speedTimer = setTimeout(() => {
    showToast('No se pudo cambiar la velocidad')
    pendingSpeed = null
    speedTimer   = null
    updateSliderUI(confirmedSpeed)
  }, 5000)
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
applyModeUI('auto')
