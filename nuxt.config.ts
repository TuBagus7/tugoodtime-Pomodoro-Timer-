export default defineNuxtConfig({
  ssr: false, // Mengharuskan SPA untuk build Android/Capacitor
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/base.css']
})
