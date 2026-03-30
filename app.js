const CONFIG = {
  intervalSegons: 30,    // Durada de cada interval (per estirar/doblar)
  totalMinuts: 30        // Durada total de la sessió
};

let interval = null;
let time = CONFIG.intervalSegons;
let totalTime = CONFIG.totalMinuts * 60;
let running = false;
let isStretch = true;
let wakeLock = null;
let startTimestamp = null;
let lastCatIndex = -1;

const catImages = [
  "img/Squinting_cat.jpg",
  "img/Ginger_european_cat.jpg",
  "img/British_Shorthair_Smiling.jpg",
  "img/black-cat.jpg"
];

const startScreen = document.getElementById("startScreen");
const startBtnScreen = document.getElementById("startBtnScreen");
const endScreen = document.getElementById("endScreen");
const appScreen = document.getElementById("appScreen");
const sessionEl = document.getElementById("sessionInfo");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const imageEl = document.getElementById("image");
const btn = document.getElementById("startBtnScreen"); // ja no fem servir el de l'HTML original
const resetBtn = document.getElementById("resetBtn");

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

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
    time = CONFIG.intervalSegons;
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
    time = CONFIG.intervalSegons;
    totalTime = CONFIG.totalMinuts * 60;
    isStretch = true;

    await enableWakeLock();

    interval = setInterval(tick, 1000);

    resetBtn.style.display = "block";

    running = true;

    updateDisplay();
    updateMessage();
  }
};

// RESET
resetBtn.onclick = () => {
  time = CONFIG.intervalSegons;
  updateDisplay();
};

// STOP
function stopApp() {
  clearInterval(interval);
  releaseWakeLock();

  const endImage = document.getElementById("endImage");
  endImage.src = getRandomCat();

  appScreen.style.display = "none";
  endScreen.style.display = "flex";

  playCompletionSound();

  running = false;
  time = CONFIG.intervalSegons;
  totalTime = CONFIG.totalMinuts * 60;

  startTimestamp = null;
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

function playCompletionSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function playNote(freq, start, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.start(start);
    osc.stop(start + duration);
  }

  const t = ctx.currentTime;

  // 🎶 tu ru ru ruuut tu ruuuut
  playNote(523, t, 0.2);     // Do
  playNote(659, t + 0.2, 0.2); // Mi
  playNote(784, t + 0.4, 0.3); // Sol
  playNote(659, t + 0.7, 0.2);
  playNote(523, t + 0.9, 0.4);
}


function getRandomCat() {
  if (catImages.length === 0) return "";

  let index = Math.floor(Math.random() * catImages.length);

  // evitar repetició
  if (catImages.length > 1 && index === lastCatIndex) {
    index = (index + 1) % catImages.length;
  }

  lastCatIndex = index;

  // anti-cache
  return catImages[index] + "?v=" + Date.now();
}

// recuperar wake lock
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await enableWakeLock();
  }
});

// INIT
updateDisplay();
