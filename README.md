# RotiRapi — Bakery HPP & Profit Calculator

PWA ringan berbasis HTML, CSS, dan JavaScript murni. Tidak memakai framework, CDN, font eksternal, database cloud, atau layanan AI.

## Fitur saat ini
- Master bahan baku dengan harga kemasan, isi, satuan, tanggal harga, dan kalkulasi harga satuan.
- Riwayat perubahan harga sederhana.
- Resep dengan komposisi, hasil jadi per batch, dan biaya tambahan.
- Simulasi kebutuhan bahan untuk target jumlah produksi.
- HPP per pcs, harga jual, laba per pcs/batch, omzet, dan margin.
- Penyimpanan lokal browser.
- Ekspor dan impor cadangan JSON.
- PWA service worker untuk cache aset aplikasi.

## Menjalankan melalui GitHub Pages
1. Buat repository bernama `bakery-hpp-calculator`.
2. Unggah seluruh isi folder ini ke root branch `main` (pastikan `index.html` ada di root).
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/(root)`, lalu Save.
5. Tunggu workflow Pages selesai, lalu buka URL yang ditampilkan pada Settings → Pages.
6. Buka sekali ketika online agar aset inti tersimpan untuk penggunaan offline.

## Menambahkan ke layar utama
- **iPhone:** buka URL di Safari → tombol Share → Add to Home Screen.
- **Android:** buka URL di Chrome → menu → Install app / Add to Home screen.

## Catatan penting
- Data disimpan di browser/perangkat ini; tidak otomatis tersinkron antarperangkat.
- Jangan hapus data situs sebelum mengekspor cadangan JSON.
- Mode offline memerlukan kunjungan pertama ketika online agar service worker dapat memasang cache.
- Hasil HPP menggunakan harga bahan terbaru. Untuk pembukuan produksi historis, versi berikutnya sebaiknya menyimpan snapshot harga per batch.
- Simulasi saat ini menghitung proporsi resep dan belum memeriksa stok fisik.
- Laba adalah estimasi sebelum pajak, diskon, retur, produk gagal, dan biaya yang belum dicatat.
- Sebelum dipakai untuk keputusan usaha, uji hasil perhitungan dengan data nyata dan kalkulasi manual.
