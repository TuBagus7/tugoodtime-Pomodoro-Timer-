<script setup>
/**
 * Komponen MusicPlayer (YouTube Edition)
 * Deskripsi: Memungkinkan pengguna memutar lofi gratis dari YouTube tanpa batasan 30 detik.
 */

const linkDefault = 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1&rel=0';
const inputLink = ref('');
const musicEmbedLink = ref(linkDefault);

// Fungsi utama untuk memperbarui pemutar musik (YouTube)
const updateMusic = () => {
  const url = inputLink.value.trim();
  
  // Jika input kosong, balikkan ke playlist lofi bawaan
  if (url === '') {
    musicEmbedLink.value = linkDefault;
    return;
  }

  let videoId = '';
  let playlistId = '';

  // LOGIKA 1: Mencari ID Playlist YouTube
  // Menggunakan regex untuk menangkap teks setelah "list=" di URL
  const playlistMatch = url.match(/[&?]list=([^&]+)/);
  if (playlistMatch) {
    playlistId = playlistMatch[1];
    // Masukkan ke format embed khusus playlist
    musicEmbedLink.value = `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0`;
    return;
  }

  // LOGIKA 2: Mencari ID Video YouTube Tunggal
  // Regex ini menangkap ID video dari format youtube.com/?v=ID atau youtu.be/ID
  const videoMatch = url.match(/(?:\?v=|&v=|youtu\.be\/)([^&?#/]+)/);
  if (videoMatch) {
    videoId = videoMatch[1];
    // Masukkan ke format embed video tunggal
    musicEmbedLink.value = `https://www.youtube.com/embed/${videoId}?rel=0`;
  } else {
    // Jika tidak ada yang cocok, beri peringatan
    alert("Mohon masukkan link YouTube yang valid (contoh: link video atau playlist)");
  }
};
</script>

<template>
  <div class="music-container glass-card">
    <div class="header">
      <h3 class="section-title">Koneksi Musik (YouTube)</h3>
      <div class="input-group">
        <input 
          v-model="inputLink" 
          type="text" 
          placeholder="Tempel link YouTube (Video/Playlist)..."
          @keyup.enter="updateMusic"
        >
        <button @click="updateMusic">Simpan</button>
      </div>
    </div>

    <div class="player-wrapper">
      <iframe 
        :src="musicEmbedLink" 
        width="100%" 
        height="180" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        loading="lazy"
      ></iframe>
    </div>
    
    <div class="hint-container">
      <p class="hint">Tips: Paste link YouTube lalu tekan Enter. 100% Gratis & Full Song!</p>
    </div>
  </div>
</template>

<style scoped>
.music-container {
  padding: 1.2rem;
  width: 100%;
  max-width: 480px; /* Samakan dengan main card agar sejajar */
  margin-top: 5px;
}

.header { margin-bottom: 1rem; }

.section-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #fff;
  font-size: 0.8rem;
}

.input-group button {
  background: var(--accent-color);
  border: none;
  border-radius: 8px;
  padding: 0 15px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.player-wrapper {
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  margin-top: 5px;
}

.hint-container {
  margin-top: 10px;
  text-align: center;
}

.hint {
  font-size: 0.7rem;
  color: var(--status-break);
  opacity: 0.9;
  font-weight: 600;
}
</style>
