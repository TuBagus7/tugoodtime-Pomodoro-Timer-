<script setup>
/**
 * Aplikasi Pomodoro Pro - Perfect Alignment Edition
 * Deskripsi: Kredit (Looping Typewriter), Judul, dan Menu sejajar sempurna di pojok layar.
 */

// Import komponen Musik
import MusicPlayer from './components/MusicPlayer.vue'

// --- State Pengaturan (Data yang bisa diubah-ubah) ---
const durasiInput = reactive({
  FOKUS: 25,             // Durasi waktu fokus (menit)
  ISTIRAHAT_SINGKAT: 5,  // Durasi istirahat pendek (menit)
  ISTIRAHAT_PANJANG: 15, // Durasi istirahat panjang (menit)
  TARGET_SIKLUS: 4       // Berapa kali fokus sebelum istirahat panjang
});

const settingsSistem = reactive({
  detik: false,          // Toggle suara detak jam
  selesai: true,         // Toggle suara alarm saat waktu habis
  autoStart: false       // Apakah sesi berikutnya langsung mulai otomatis?
});

// --- State Utama (Status jalannya aplikasi saat ini) ---
const modeSekarang = ref('FOKUS');        // Mode aktif: FOKUS, ISTIRAHAT_SINGKAT, atau ISTIRAHAT_PANJANG
const detikTersisa = ref(durasiInput.FOKUS * 60); // Sisa waktu dalam satuan DETIK
const sedangBerjalan = ref(false);        // Apakah timer sedang menghitung mundur?
const tampilkanPengaturan = ref(false);   // Toggle buka/tutup panel setting
const tampilkanModal = ref(false);        // Toggle munculnya popup saat waktu habis
const tampilkanInfo = ref(false);         // Toggle popup info teknik pomodoro
const tampilkanMenu = ref(false);         // Toggle menu dropdown (burger)
const isLocked = ref(false);              // Status 'Lock View' (mengunci layar)
const jumlahFokusSelesai = ref(0);        // Pencatat berapa kali sesi fokus berhasil diselesaikan
let intervalId = null;                    // Menyimpan ID interval agar bisa dihentikan nanti

// --- Sistem Suara (Menggunakan Web Audio API) ---
const playSound = (type) => {
  if (process.client) { // Pastikan kode berjalan di browser, bukan server
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Suara detak kecil (tick) setiap detik
    if (type === 'tick' && settingsSistem.detik) {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 0.05);
    } 
    // Suara alarm nyaring saat waktu timer habis
    else if (type === 'alarm' && settingsSistem.selesai) {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      oscillator.start(); oscillator.stop(audioContext.currentTime + 1);
    }
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else if (document.exitFullscreen) document.exitFullscreen();
  tampilkanMenu.value = false;
};

// --- Perhitungan Waktu & Warna (Computed) ---
// Mengubah sisa detik menjadi format menit:detik (contoh: 04:59)
const tampilanWaktu = computed(() => {
  const menit = Math.floor(detikTersisa.value / 60);
  const detik = detikTersisa.value % 60;
  return `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
});

// Menentukan warna tema berdasarkan mode yang sedang aktif
const warnaTema = computed(() => {
  if (modeSekarang.value === 'ISTIRAHAT_SINGKAT') return 'var(--status-break)';
  if (modeSekarang.value === 'ISTIRAHAT_PANJANG') return '#3b82f6';
  return 'var(--status-work)';
});

// Mengubah teks status agar enak dibaca (Ganti '_' jadi spasi)
const labelModeSekarang = computed(() => {
  return modeSekarang.value.replace(/_/g, ' ');
});

// --- Logika Inti Pomodoro ---
// Pantau jika ada perubahan durasi di pengaturan, maka update sisa waktu timer
watch(durasiInput, () => {
  if (!sedangBerjalan.value) detikTersisa.value = durasiInput[modeSekarang.value] * 60;
}, { deep: true });

// Ganti mode (Fokus/Break) dan update timernya
const gantiMode = (modeBaru) => {
  hentiTimer();
  modeSekarang.value = modeBaru;
  detikTersisa.value = durasiInput[modeBaru] * 60;
};

// Start or Pause timer
const toggleTimer = () => {
  if (sedangBerjalan.value) hentiTimer();
  else mulaiTimer();
};

// Jalankan hitung mundur timer
const mulaiTimer = () => {
  sedangBerjalan.value = true;
  intervalId = setInterval(() => {
    if (detikTersisa.value > 0) {
      detikTersisa.value--;
      if (sedangBerjalan.value) playSound('tick'); // Suara detak
    } else {
      selesaiSesi(); // Waktu habis!
    }
  }, 1000); // 1 detik sekali
};

// Berhentikan hitung mundur
const hentiTimer = () => {
  sedangBerjalan.value = false;
  clearInterval(intervalId);
};

// Reset timer ke waktu awal semula
const resetTimer = () => {
  hentiTimer();
  detikTersisa.value = durasiInput[modeSekarang.value] * 60;
};

// Logika otomatisasi siklus (Kapan istirahat singkat vs panjang?)
const selesaiSesi = () => {
  hentiTimer();
  playSound('alarm'); // Bunyikan alarm
  if (modeSekarang.value === 'FOKUS') {
    jumlahFokusSelesai.value++;
    // Jika sudah mencapai target siklus, saatnya istirahat panjang
    if (jumlahFokusSelesai.value >= durasiInput.TARGET_SIKLUS) {
      modeSekarang.value = 'ISTIRAHAT_PANJANG';
      jumlahFokusSelesai.value = 0;
    } else modeSekarang.value = 'ISTIRAHAT_SINGKAT';
  } else {
    // Jika baru selesai istirahat, balik lagi ke mode Fokus
    modeSekarang.value = 'FOKUS';
  }
  detikTersisa.value = durasiInput[modeSekarang.value] * 60;
  tampilkanModal.value = true; // Munculkan pop-up pemberitahuan
};

// Menutup popup dan (jika auto-start nyala) jalankan sesi berikutnya
const tutupModal = () => {
  tampilkanModal.value = false;
  if (settingsSistem.autoStart) mulaiTimer();
};
</script>

<template>
  <div class="app-wrapper">
    <!-- Lock Overlay -->
    <div v-if="isLocked" class="lock-overlay" @dblclick="isLocked = false">
      <div class="lock-hint">Double Click to Unlock 🔓</div>
    </div>

    <!-- Modals -->
    <Transition name="fade">
      <div v-if="tampilkanModal" class="modal-overlay" @click.self="tampilkanModal = false">
        <div class="modal-content glass-card">
          <img src="/coffee.png" alt="Coffee" class="modal-img">
          <h2 class="modal-title">Sesi Selesai!</h2>
          <p class="modal-text">
            {{ modeSekarang === 'FOKUS' ? 'break bro come on got your coffe or walk for a sec' : 'Istirahat selesai, ayo gass fokus lagi!' }}
          </p>
          <button class="btn btn-primary" @click="tutupModal">Lanjut!</button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="tampilkanInfo" class="modal-overlay" @click.self="tampilkanInfo = false">
        <div class="modal-content glass-card info-modal">
          <h2 class="modal-title">Pomodoro Technique 🍅</h2>
          <div class="info-body">
            <p>Metode manajemen waktu menggunakan timer untuk membagi waktu kerja menjadi interval (25 menit).</p>
            <ul>
              <li>Meningkatkan fokus</li>
              <li>Mencegah Burnout</li>
              <li>Efisiensi kerja</li>
            </ul>
          </div>
          <button class="btn btn-secondary" @click="tampilkanInfo = false">Tutup</button>
        </div>
      </div>
    </Transition>

    <header class="corner-nav">
      <!-- Pojok Kiri: Infinite Typewriter -->
      <div class="nav-item left-item">
        <div class="typewriter-container">
          <span class="typewriter-text">
            Created by <span class="author">Tu Bagus Dwi Fikri</span>
          </span>
        </div>
      </div>

      <!-- Tengah: Judul & Gear -->
      <div class="title-container">
        <h1 class="title-main">Pomodoro Pro</h1>
        <button class="settings-toggle" @click="tampilkanPengaturan = !tampilkanPengaturan" title="Pengaturan">⚙️</button>
      </div>

      <!-- Pojok Kanan: Burger Menu -->
      <div class="nav-item right-item">
        <button class="menu-trigger glass-card" @click="tampilkanMenu = !tampilkanMenu" :class="{ active: tampilkanMenu }">
          <span v-if="!tampilkanMenu">☰</span>
          <span v-else>✖</span>
        </button>
        
        <Transition name="slide-fade">
          <div v-if="tampilkanMenu" class="dropdown-menu glass-card">
            <button class="menu-item" @click="tampilkanInfo = true; tampilkanMenu = false">❓ Info Pomodoro</button>
            <button class="menu-item" @click="toggleFullscreen">📺 Fullscreen</button>
            <button class="menu-item" @click="isLocked = true; tampilkanMenu = false">🔒 Lock View</button>
          </div>
        </Transition>
      </div>
    </header>

    <div class="app-container">
      <!-- Panel Pengaturan (Muncul di bawah header) -->
      <Transition name="slide">
        <div v-if="tampilkanPengaturan" class="settings-panel">
          <div class="settings-header">
            <h3 class="settings-title">Durasi (Menit)</h3>
            <button class="close-settings" @click="tampilkanPengaturan = false">✖</button>
          </div>
          <div class="settings-row">
            <div class="input-item"><label>Fokus</label><input type="number" v-model.number="durasiInput.FOKUS"></div>
            <div class="input-item"><label>Short</label><input type="number" v-model.number="durasiInput.ISTIRAHAT_SINGKAT"></div>
            <div class="input-item"><label>Long</label><input type="number" v-model.number="durasiInput.ISTIRAHAT_PANJANG"></div>
          </div>
          <div class="toggle-list mt-3">
             <label><input type="checkbox" v-model="settingsSistem.detik"> Suara Detik</label>
             <label><input type="checkbox" v-model="settingsSistem.autoStart"> Auto-Start</label>
          </div>
        </div>
      </Transition>

      <!-- Main Layout -->
      <div class="timer-layout">
        <div class="mode-selector glass-card">
          <button @click="gantiMode('FOKUS')" :class="{ active: modeSekarang === 'FOKUS' }">Fokus</button>
          <button @click="gantiMode('ISTIRAHAT_SINGKAT')" :class="{ active: modeSekarang === 'ISTIRAHAT_SINGKAT' }">Short Break</button>
          <button @click="gantiMode('ISTIRAHAT_PANJANG')" :class="{ active: modeSekarang === 'ISTIRAHAT_PANJANG' }">Long Break</button>
        </div>

        <div class="main-card glass-card">
          <div class="cycle-pill" v-if="modeSekarang === 'FOKUS'">
            Sesi {{ jumlahFokusSelesai + 1 }} / {{ durasiInput.TARGET_SIKLUS }}
          </div>
          <div class="status-indicator" :style="{ backgroundColor: warnaTema }">{{ labelModeSekarang }}</div>
          <div class="timer-text">{{ tampilanWaktu }}</div>
          <div class="action-buttons">
            <button @click="toggleTimer" class="btn btn-primary btn-lg">{{ sedangBerjalan ? 'PAUSE' : 'START' }}</button>
            <button @click="resetTimer" class="btn btn-secondary">RESET</button>
          </div>
        </div>

        <MusicPlayer />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper { width: 100%; display: flex; justify-content: center; position: relative; min-height: 100vh; }
.app-container { 
  width: 100%; 
  max-width: 500px; 
  min-height: 100vh;
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  gap: 25px; 
  padding: 100px 20px 40px; /* Beri ruang agar tidak kena header fixed */
}

/* Perfect Header Alignment */
.corner-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  background: transparent;
}

.nav-item { flex: 1; }
.left-item { display: flex; justify-content: flex-start; }
.right-item { display: flex; justify-content: flex-end; position: relative; }

/* Centered Title & Gear */
.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px; 
  flex: 0 1 auto;
  z-index: 1001;
}

/* Infinite Typewriter */
.typewriter-container { display: inline-block; overflow: hidden; }
.typewriter-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  border-right: 2px solid var(--accent-color);
  width: 29ch; /* Panjang karakter: Created by Tu Bagus Dwi Fikri */
  overflow: hidden;
  display: block;
  animation: typing-infinite 8s steps(29) infinite, blink-caret 0.75s step-end infinite;
}
.author { color: var(--accent-color); font-weight: 800; display: inline; }

@keyframes typing-infinite {
  0% { width: 0; }
  70% { width: 29ch; } /* Ngetik dari kiri ke kanan */
  90% { width: 29ch; } /* Berhenti sebentar di akhir */
  90.01% { width: 0; } /* Hilang INSTAN (Tanpa hapus satu-satu) */
  100% { width: 0; }
}

@keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: var(--accent-color) } }

/* Main Title Font */
.title-main {
  font-size: 2rem;
  font-weight: 950;
  text-align: center;
  margin: 0;
  line-height: 1;
  letter-spacing: -1px;
  background: linear-gradient(to right, #fff, rgba(255,255,255,0.7));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.settings-toggle {
  background: transparent;
  border: none;
  font-size: 1.8rem; /* Perbesar ukuran gear */
  cursor: pointer;
  transition: transform 0.4s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -2px; 
}

.settings-toggle:hover {
  transform: rotate(90deg); /* Animasi putar */
}

/* Burger Menu */
.menu-trigger {
  width: 45px; height: 45px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer; transition: 0.3s; color: #fff; font-size: 1.2rem;
}
.menu-trigger.active { background: rgba(56, 189, 248, 0.2); color: var(--accent-color); }

.dropdown-menu {
  position: absolute; top: 60px; right: 0; width: 220px;
  padding: 10px; display: flex; flex-direction: column; gap: 5px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.6); z-index: 2000;
}

.menu-item {
  background: transparent; border: none; color: #fff; padding: 12px 15px;
  text-align: left; border-radius: 8px; cursor: pointer; transition: 0.2s;
  font-size: 0.9rem; font-weight: 500;
}
.menu-item:hover { background: rgba(255,255,255,0.1); color: var(--accent-color); }
.menu-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 5px 0; }

/* Settings */
.settings-panel { 
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 550px;
  padding: 2.5rem; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  background: #111827; /* Solid Dark - Zero Transparency */
  border-radius: 0 0 30px 30px; /* Rounded only at bottom */
  box-shadow: 0 30px 70px rgba(0,0,0,1);
  border: 1px solid rgba(255,255,255,0.05);
  z-index: 5000; /* Must be above everything (including header) */
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-settings {
  background: rgba(255,255,255,0.05);
  border: none;
  color: #fff;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  transition: 0.2s;
}

.close-settings:hover {
  background: var(--status-work);
  transform: scale(1.1);
}
.settings-title { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; }
.settings-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
.input-item input { width: 100%; background: rgba(255,255,255,0.05); border: none; color: #fff; padding: 8px; border-radius: 8px; text-align: center; }
.toggle-list { display: flex; gap: 20px; justify-content: center; }
.toggle-list label { font-size: 0.8rem; display: flex; align-items: center; gap: 8px; cursor: pointer; }

/* Timer Card */
.timer-layout { 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  align-items: center; /* Pastikan semua card terpusat */
  width: 100%;
}
.mode-selector { 
  display: flex; 
  padding: 8px; 
  gap: 10px; 
  border-radius: 16px; 
  width: 100%;
  max-width: 480px;
}
.mode-selector button { flex: 1; background: transparent; border: none; color: var(--text-muted); padding: 10px; font-weight: 600; cursor: pointer; }
.mode-selector button.active { background: rgba(255, 255, 255, 0.1); color: #fff; border-radius: 10px; }

.main-card { 
  padding: 3rem 2rem; 
  text-align: center; 
  position: relative; 
  width: 100%;
  max-width: 480px;
}
.cycle-pill { position: absolute; top: 15px; right: 15px; font-size: 0.75rem; color: var(--text-muted); opacity: 0.7; }
.status-indicator { display: inline-block; padding: 6px 20px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; margin-bottom: 15px; color: #000; }
.timer-text { font-size: 6rem; font-weight: 950; letter-spacing: -4px; line-height: 1; margin-bottom: 1rem; font-family: 'JetBrains Mono', monospace; }
.action-buttons { display: flex; gap: 15px; }
.btn-lg { flex: 2 !important; padding: 20px !important; font-size: 1.3rem !important; }

/* Lock & Modals */
.lock-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.1); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; }
.lock-hint { background: #000; border: none; padding: 15px 30px; border-radius: 30px; font-size: 0.9rem; animation: pulse 2s infinite; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 5000; display: flex; justify-content: center; align-items: center; padding: 20px; }
.modal-content { max-width: 420px; width: 100%; padding: 2.5rem; text-align: center; }
.modal-img { border-radius: 20px; width: 100%; height: 200px; object-fit: cover; margin-bottom: 20px; }

.btn { border: none; border-radius: 15px; font-weight: 800; cursor: pointer; padding: 12px; transition: 0.2s; }
.btn-primary { background: var(--accent-color); color: #000; }
.btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: none; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; max-height: 600px; opacity: 1; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; overflow: hidden; }
.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s; }
.slide-fade-enter-from { transform: translateY(-10px); opacity: 0; }

@keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

@media (max-width: 900px) {
  .corner-nav { padding: 10px 20px; }
  .typewriter-text { font-size: 0.7rem; }
  .title-main { font-size: 1.6rem; }
}

@media (max-width: 650px) {
  /* Ubah Header jadi Susunan Vertikal di HP */
  .corner-nav { 
    flex-direction: column; 
    height: auto; 
    padding: 20px 15px;
    gap: 10px;
  }
  
  .left-item { 
    order: 2; 
    min-width: unset;
    justify-content: center;
    display: flex !important;
    width: 100%; /* Pastikan ambil lebar penuh agar centering kerja */
  }

  .title-container {
    order: 1; /* Judul di atas */
    margin-bottom: 5px;
  }

  .right-item {
    position: absolute;
    top: 20px;
    right: 20px;
    min-width: unset;
    z-index: 1002;
  }

  .typewriter-text { font-size: 0.65rem; }
  .title-main { font-size: 1.4rem; }
  .menu-trigger { width: 42px; height: 42px; }
  
  /* Beri ruang lebih di atas agar tidak tertutup header yang meninggi */
  .app-container { padding-top: 130px; } 
}

@media (max-width: 450px) {
  .title-main { font-size: 1.2rem; }
  .typewriter-text { font-size: 0.6rem; }
}
</style>
