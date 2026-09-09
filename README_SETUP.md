# JPPC Firebase-Ready Website

Versi ini dibuat untuk **GitHub Pages + Firebase Authentication + Cloud Firestore**.

## Penting: versi ini dibuat supaya bisa tetap memakai Firebase Spark (tanpa billing)
Cloud Storage for Firebase sekarang memerlukan proyek pada plan Blaze. Karena itu versi ini **tidak memakai Firebase Storage**. Foto admin dikompres di browser lalu disimpan sebagai data URL pada dokumen Firestore terpisah.

Kelebihan:
- Firebase Auth untuk login admin.
- Firestore untuk site content, theme, member, event, ranking, gallery, logo, hero.
- Perubahan admin langsung terlihat oleh semua pengunjung.
- Bisa di-host gratis di GitHub Pages.
- Tidak membutuhkan server sendiri.
- Tidak membutuhkan Cloud Storage untuk mode ini.

Batasan:
- Firestore memiliki batas ukuran dokumen. Website otomatis mengompres gambar hingga kira-kira 600–650 KB.
- Untuk jumlah foto sangat banyak / kualitas foto original, sebaiknya nanti upgrade ke Blaze + Firebase Storage atau image CDN.

---

# A. Buat Firebase Project

1. Buka Firebase Console.
2. Create Project.
3. Setelah project jadi, klik ikon **Web `</>`**.
4. Register App, misalnya `JPPC Website`.
5. Firebase memberikan `firebaseConfig`.

Buka:
`js/firebase-config.js`

Ganti semua `PASTE_...` dengan config yang diberikan Firebase.

---

# B. Aktifkan Authentication

Firebase Console → **Authentication** → Get started.

Aktifkan:
**Email/Password**

Kemudian:
Authentication → Users → Add user

Contoh:
`admin@jppc.com`
dan password Anda sendiri.

Catat UID user admin tersebut.

---

# C. Aktifkan Cloud Firestore

Firebase Console → **Firestore Database** → Create database.

Pilih lokasi yang dekat dengan pengguna Anda.

Setelah database dibuat, buka tab **Rules**.

Copy seluruh isi file:
`firestore.rules`

Paste ke Rules lalu klik **Publish**.

---

# D. Daftarkan Admin

Ini langkah penting agar user tidak bisa menjadikan dirinya admin.

Firestore → Data → Start collection.

Collection ID:
`admins`

Document ID:
**UID user admin dari Firebase Authentication**

Tambahkan field:

Field: `enabled`
Type: boolean
Value: `true`

Contoh:

admins
  └── AbCdEf123456...
       └── enabled: true

Setelah itu akun tersebut mempunyai hak edit.

---

# E. Buat data awal

Tidak wajib. Website bisa terbuka dengan data default.

Login ke Admin dari website, kemudian:
- edit Site Content
- edit Theme
- upload Logo
- upload Hero
- tambah Events
- tambah Members
- tambah Rankings
- tambah Gallery

Saat Save pertama kali, data otomatis dibuat di Firestore.

---

# F. Test secara lokal

Karena website memakai ES Modules, **jangan hanya double-click index.html** di beberapa browser.

Cara termudah:

### Python
Di folder website:
`python -m http.server 8000`

Lalu buka:
`http://localhost:8000`

Atau gunakan VS Code + Live Server.

---

# G. Upload ke GitHub Pages

Upload seluruh isi folder ini ke repository GitHub:

- index.html
- css/
- js/

Anda tidak perlu meng-upload README jika tidak mau.

GitHub:
Settings → Pages → Deploy from branch → `main` → `/root`

Setelah beberapa menit website mendapat URL:
`https://USERNAME.github.io/REPOSITORY/`

---

# H. Authorized Domain Firebase

Biasanya Firebase Auth menerima domain yang diizinkan.

Buka:
Firebase Console → Authentication → Settings → Authorized domains

Tambahkan hostname GitHub Pages bila dibutuhkan:
`USERNAME.github.io`

Jika nanti memakai custom domain, tambahkan custom domain tersebut juga.

---

# I. Security

`firebaseConfig` memang terlihat di browser. Itu normal untuk Firebase Web.

Keamanan **bukan** dengan menyembunyikan API key, tetapi dengan:
- Firebase Authentication
- Firestore Security Rules
- hanya UID di collection `admins` yang mendapat izin write

File `firestore.rules` sudah disiapkan untuk pola ini.

---

# Struktur Firestore

site/main
assets/logo
assets/hero
events/{eventId}
members/{memberId}
rankings/{rankingId}
gallery/{photoId}
admins/{adminUid}

---

# Firebase SDK

Website menggunakan Firebase Modular Web SDK via official Firebase CDN.

Tidak perlu npm / build tools untuk GitHub Pages.

---

# Jika suatu hari ingin Firebase Storage

Cloud Storage for Firebase memerlukan plan Blaze. Jika nanti Anda mengaktifkan billing, aplikasi dapat diubah agar:
- foto original disimpan di Storage
- Firestore hanya menyimpan download URL
- kapasitas galeri jauh lebih besar
