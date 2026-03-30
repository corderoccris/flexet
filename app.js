let interval = null;
let time = 30;
let totalTime = 1800;
let running = false;
let isStretch = true;
let wakeLock = null;
let startTimestamp = null;

const startScreen = document.getElementById("startScreen");
const startBtnScreen = document.getElementById("startBtnScreen");

const appScreen = document.getElementById("appScreen");
const sessionEl = document.getElementById("sessionInfo");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const imageEl = document.getElementById("image");
const btn = document.getElementById("startBtnScreen"); // ja no fem servir el de l'HTML original
const resetBtn = document.getElementById("resetBtn");

// DISPLAY
function updateDisplay() {
  timerEl.textContent = time;
  timerEl.classList.add("pulse");
  setTimeout(() => timerEl.classList.remove("pulse"), 150);
}

// MISSATGE + COLORS + IMATGE
function updateMessage() {
  if (isStretch) {
    messageEl.textContent = "Estirar piernas!";
    appScreen.classList.remove("bend");
    appScreen.classList.add("stretch");
    imageEl.src = "img/flexet-estirat.png";
  } else {
    messageEl.textContent = "Dobla las piernas!";
    appScreen.classList.remove("stretch");
    appScreen.classList.add("bend");
    imageEl.src = "img/flexet-doblat.png";
  }
}

// SO SUAU
function playSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.4);
}

// VIBRACIÓ
function vibrate() {
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

// WAKE LOCK
async function enableWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {}
}

function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release();
    wakeLock = null;
  }
}

// TICK
function tick() {
  time--;
  totalTime--;

  if (time <= 0) {
    playSound();
    vibrate();
    isStretch = !isStretch;
    time = 30;
  }

  if (totalTime <= 0) {
    stopApp();
    return;
  }

  updateDisplay();
  updateMessage();
  updateSessionInfo();
}

// START DES DE PANTALLA INICIAL
startBtnScreen.onclick = async () => {
  startScreen.style.display = "none";
  appScreen.style.display = "flex";

  startTimestamp = Date.now();
  updateSessionInfo();

  if (!running) {
    time = 30;
    totalTime = 1800;
    isStretch = true;

    await enableWakeLock();

    interval = setInterval(tick, 1000);

    resetBtn.style.display = "block";

    running = true;

    updateDisplay();
    updateMessage();
  }
};

// RESET (només 30s)
resetBtn.onclick = () => {
  time = 30;
  updateDisplay();
};

// STOP
function stopApp() {
  clearInterval(interval);
  releaseWakeLock();

  appScreen.style.display = "none";
  startScreen.style.display = "flex";

  running = false;
  time = 30;
  totalTime = 1800;

  updateDisplay();
  messageEl.textContent = "";
  imageEl.src = "";

  appScreen.classList.remove("stretch", "bend");

  startTimestamp = null;
  sessionEl.textContent = "";
}

function updateSessionInfo() {
  if (!startTimestamp) return;

  const now = new Date();
  const start = new Date(startTimestamp);

  const diffSec = Math.floor((now - start) / 1000);
  const minutes = Math.floor(diffSec / 60);

  const startTimeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  sessionEl.textContent = `Inici: ${startTimeStr} · portes ${minutes} min`;
}

// recuperar wake lock
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await enableWakeLock();
  }
});

// INIT
updateDisplay();