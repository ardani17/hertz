# Requirements Document

## Introduction

Horizon adalah platform komunitas untuk para trader dengan nuansa "keluarga" yang hangat. Platform ini menggabungkan micro-blogging (cerita pendek), artikel panjang, dan galeri media bergaya Instagram. Desain platform menghindari tema "cyber/hacker" yang agresif, dan mengutamakan tampilan yang tenang, hangat, serta mudah dibaca. Anggota komunitas disebut sebagai "Keluarga Horizon", bukan "Users" atau "Members".

Platform dibangun menggunakan Next.js (App Router) dengan TypeScript, Tailwind CSS, PostgreSQL (via Prisma ORM), dan penyimpanan media berbasis S3-compatible API (Cloudflare R2 / AWS S3).

## Glossary

- **Platform**: Aplikasi web Horizon Community Platform secara keseluruhan
- **Keluarga_Horizon**: Sebutan untuk semua pengguna dan anggota komunitas Horizon (menggantikan istilah "Users" atau "Members")
- **Post**: Entitas konten utama yang memiliki tipe SHORT_STORY, ARTICLE, atau GALLERY
- **Short_Story**: Tipe post berupa micro-blog pendek, biasanya dikirim melalui Telegram Bot dengan command `/story`
- **Article**: Tipe post berupa artikel panjang, dibuat melalui Admin Dashboard atau Telegram Bot dengan command `/cerita`
- **Gallery**: Tipe post berupa koleksi media (gambar/video) dengan caption, dibuat melalui Admin Dashboard
- **Media**: Entitas file media (IMAGE atau VIDEO) yang terkait dengan sebuah Post
- **Navbar**: Komponen navigasi global yang tampil di semua halaman
- **Home_Page**: Halaman utama (`/`) yang menampilkan feed Short_Story dan Article
- **Gallery_Page**: Halaman galeri (`/gallery`) yang menampilkan post bertipe Gallery
- **Admin_Dashboard**: Halaman admin (`/admin`) yang dilindungi password untuk mengelola konten
- **Telegram_Webhook**: Endpoint API (`/api/telegram`) yang menerima pesan dari Telegram Bot, dapat digunakan oleh semua anggota di grup yang diizinkan
- **S3_Storage**: Layanan penyimpanan objek S3-compatible (Cloudflare R2 / AWS S3) untuk file media
- **Pre_Signed_URL**: URL sementara yang dihasilkan oleh S3_Storage untuk upload file secara langsung
- **Carousel**: Komponen UI swipeable (menggunakan embla-carousel-react) untuk menampilkan beberapa media dalam satu Gallery post
- **Admin**: Pengguna yang memiliki akses ke Admin_Dashboard dan Telegram_Webhook, divalidasi melalui ADMIN_PASSWORD dan ADMIN_CHAT_ID
- **Feed_Card**: Komponen UI kartu yang menampilkan satu Post di Home_Page

## Requirements

### Requirement 1: Desain Visual dan Identitas Platform

**User Story:** Sebagai Keluarga_Horizon, saya ingin platform memiliki tampilan yang hangat dan nyaman dibaca, sehingga saya merasa betah saat menggunakan platform.

#### Acceptance Criteria

1. THE Platform SHALL menggunakan Forest Green (`#228B22`) atau Emerald Green (`#50C878`) sebagai warna utama untuk aksi dan aksen
2. THE Platform SHALL menggunakan Off-white (`#FAF9F6`) atau Pale Cream (`#FFFDD0`) sebagai warna latar belakang
3. THE Platform SHALL menggunakan font rounded sans-serif (Nunito atau Quicksand) untuk heading dan font readable sans-serif (Inter atau Roboto) untuk body text
4. THE Platform SHALL menggunakan istilah "Keluarga Horizon" di seluruh antarmuka pengguna sebagai pengganti "Users" atau "Members"

### Requirement 2: Navigasi Global (Navbar)

**User Story:** Sebagai Keluarga_Horizon, saya ingin navigasi yang jelas dan konsisten di semua halaman, sehingga saya dapat berpindah antar bagian platform dengan mudah.

#### Acceptance Criteria

1. THE Navbar SHALL menampilkan tautan "Beranda" yang mengarah ke halaman `/`
2. THE Navbar SHALL menampilkan tautan "Gallery" yang mengarah ke halaman `/gallery`
3. THE Navbar SHALL menampilkan tautan "Tools" sebagai external link ke `https://tools.horizon.com` yang terbuka di tab baru dengan atribut `target="_blank"` dan `rel="noopener noreferrer"`
4. THE Navbar SHALL tampil secara konsisten di semua halaman Platform

### Requirement 3: Halaman Beranda (Home Page)

**User Story:** Sebagai Keluarga_Horizon, saya ingin melihat feed cerita pendek dan artikel terbaru di halaman utama, sehingga saya dapat mengikuti konten terkini dari komunitas.

#### Acceptance Criteria

1. WHEN Home_Page dimuat, THE Platform SHALL menampilkan daftar Post bertipe SHORT_STORY dan ARTICLE yang diurutkan berdasarkan tanggal pembuatan secara descending (terbaru di atas)
2. THE Feed_Card SHALL membedakan tampilan secara visual antara Post bertipe SHORT_STORY dan Post bertipe ARTICLE
3. WHEN sebuah Post bertipe ARTICLE memiliki title, THE Feed_Card SHALL menampilkan title tersebut secara menonjol
4. THE Feed_Card SHALL menampilkan konten Post dalam format yang bersih dan mudah dibaca

### Requirement 4: Halaman Galeri (Gallery Page)

**User Story:** Sebagai Keluarga_Horizon, saya ingin melihat galeri media dari komunitas dalam tampilan yang menarik, sehingga saya dapat menikmati konten visual yang dibagikan.

#### Acceptance Criteria

1. WHEN Gallery_Page dimuat, THE Platform SHALL menampilkan daftar Post bertipe GALLERY beserta relasi Media yang diurutkan berdasarkan field `order` secara ascending
2. WHEN sebuah Gallery Post memiliki lebih dari satu Media, THE Carousel SHALL menampilkan media tersebut dalam komponen swipeable menggunakan embla-carousel-react
3. WHEN sebuah Media memiliki mediaType VIDEO, THE Platform SHALL merender elemen `<video>` dengan atribut `controls` dan styling `w-full aspect-square object-cover`
4. WHEN sebuah Media memiliki mediaType IMAGE, THE Platform SHALL merender elemen `<img>` dengan styling yang sesuai
5. THE Platform SHALL menampilkan konten (caption) dari Gallery Post di bawah komponen media

### Requirement 5: Keamanan Admin Dashboard

**User Story:** Sebagai Admin, saya ingin Admin_Dashboard dilindungi oleh password, sehingga hanya saya yang dapat mengakses fitur pengelolaan konten.

#### Acceptance Criteria

1. WHEN Keluarga_Horizon mengakses `/admin`, THE Platform SHALL menampilkan form input password sebelum memberikan akses ke Admin_Dashboard
2. WHEN password yang dimasukkan sesuai dengan nilai ADMIN_PASSWORD di environment variable, THE Platform SHALL memberikan akses ke Admin_Dashboard
3. WHEN password yang dimasukkan tidak sesuai dengan nilai ADMIN_PASSWORD, THE Platform SHALL menolak akses dan menampilkan pesan error yang informatif
4. IF ADMIN_PASSWORD tidak dikonfigurasi di environment variable, THEN THE Platform SHALL menolak semua akses ke Admin_Dashboard

### Requirement 6: Upload Media Galeri (Admin)

**User Story:** Sebagai Admin, saya ingin mengunggah gambar dan video ke galeri melalui Admin_Dashboard, sehingga saya dapat membagikan konten visual kepada Keluarga_Horizon.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL menyediakan input file multi-select dengan atribut `accept="image/*,video/*"` untuk upload media galeri
2. WHEN Admin memilih file gambar yang berukuran lebih dari 5MB, THE Admin_Dashboard SHALL menolak file tersebut dan menampilkan pesan validasi error
3. WHEN Admin memilih file video yang berukuran lebih dari 25MB, THE Admin_Dashboard SHALL menolak file tersebut dan menampilkan pesan validasi error
4. WHEN Admin mengirimkan form upload, THE Platform SHALL mengunggah file ke S3_Storage menggunakan Pre_Signed_URL atau Server Actions
5. WHEN upload ke S3_Storage berhasil, THE Platform SHALL menyimpan URL final, mediaType, order, dan caption ke database sebagai Post bertipe GALLERY dengan relasi Media
6. THE Admin_Dashboard SHALL menyediakan input untuk caption (konten) yang akan ditampilkan bersama media galeri

### Requirement 7: Editor Artikel (Admin)

**User Story:** Sebagai Admin, saya ingin menulis dan mempublikasikan artikel melalui Admin_Dashboard, sehingga saya dapat berbagi analisis dan konten panjang kepada Keluarga_Horizon.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL menyediakan form dengan field Title dan Textarea untuk membuat Post bertipe ARTICLE
2. WHEN Admin mengirimkan form artikel, THE Platform SHALL menyimpan data ke database sebagai Post bertipe ARTICLE dengan title dan content yang sesuai
3. THE Textarea SHALL mendukung line breaks sehingga format paragraf dari Admin terjaga saat ditampilkan

### Requirement 8: Moderasi Konten (Admin)

**User Story:** Sebagai Admin, saya ingin dapat menghapus post yang tidak sesuai, sehingga saya dapat menjaga kualitas konten di platform.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL menampilkan daftar semua Post yang ada di database
2. THE Admin_Dashboard SHALL menyediakan tombol "Delete" pada setiap Post di daftar moderasi
3. WHEN Admin menekan tombol "Delete" pada sebuah Post, THE Platform SHALL menghapus Post tersebut beserta semua relasi Media terkait secara cascade
4. WHEN sebuah Gallery Post dihapus, THE Platform SHALL menghapus file media terkait dari S3_Storage

### Requirement 9: Telegram Bot Webhook

**User Story:** Sebagai Keluarga_Horizon di grup Telegram, saya ingin mengirim cerita pendek dan artikel melalui Telegram Bot di grup, sehingga semua anggota grup dapat mempublikasikan konten dengan cepat.

#### Acceptance Criteria

1. THE Platform SHALL menyediakan endpoint POST di `/api/telegram` untuk menerima webhook dari Telegram Bot
2. WHEN request diterima dari chat yang bukan merupakan grup yang diizinkan (berdasarkan ALLOWED_CHAT_ID di environment variable), THE Telegram_Webhook SHALL langsung mengembalikan response HTTP 200 OK tanpa memproses pesan
3. WHEN request diterima dari grup yang diizinkan, THE Telegram_Webhook SHALL memproses pesan dari semua anggota grup tersebut tanpa membatasi berdasarkan user ID individu
4. WHEN pesan teks dimulai dengan `/story `, THE Telegram_Webhook SHALL mengekstrak teks setelah command dan menyimpannya sebagai Post bertipe SHORT_STORY
5. WHEN pesan teks dimulai dengan `/cerita `, THE Telegram_Webhook SHALL mengekstrak teks setelah command dan menyimpannya sebagai Post bertipe ARTICLE
6. WHEN command `/cerita` digunakan, THE Telegram_Webhook SHALL mengekstrak baris pertama sebagai title dan sisa teks sebagai content dari Article
7. IF pesan tidak dimulai dengan command yang dikenali, THEN THE Telegram_Webhook SHALL mengabaikan pesan dan mengembalikan response HTTP 200 OK

### Requirement 10: Database Schema dan Data Model

**User Story:** Sebagai developer, saya ingin schema database yang terstruktur dengan baik, sehingga data platform tersimpan secara konsisten dan relasi antar entitas terjaga.

#### Acceptance Criteria

1. THE Platform SHALL menggunakan PostgreSQL sebagai database dengan Prisma sebagai ORM
2. THE Post model SHALL memiliki field: id (cuid), title (opsional), content (teks, opsional), type (PostType enum), media (relasi ke Media), createdAt (timestamp), dan updatedAt (timestamp)
3. THE Media model SHALL memiliki field: id (cuid), url (string), mediaType (MediaType enum), order (integer untuk sorting), dan postId (foreign key ke Post)
4. WHEN sebuah Post dihapus, THE Platform SHALL menghapus semua Media terkait secara cascade melalui relasi database
5. THE PostType enum SHALL memiliki nilai: SHORT_STORY, ARTICLE, dan GALLERY
6. THE MediaType enum SHALL memiliki nilai: IMAGE dan VIDEO

### Requirement 11: Konfigurasi Deployment

**User Story:** Sebagai developer, saya ingin konfigurasi deployment yang siap pakai, sehingga platform dapat di-deploy dengan mudah ke lingkungan produksi.

#### Acceptance Criteria

1. THE Platform SHALL menyediakan Dockerfile yang dioptimasi untuk Next.js standalone build
2. THE Platform SHALL menyediakan dokumentasi di README.md yang mencantumkan catatan: "If deploying with Nginx, ensure `client_max_body_size 100M;` is set to allow video uploads"
3. THE Platform SHALL menggunakan environment variable untuk konfigurasi sensitif: DATABASE_URL, ADMIN_PASSWORD, ALLOWED_CHAT_ID, dan kredensial S3_Storage

### Requirement 12: Serialisasi dan Parsing Konten Post

**User Story:** Sebagai developer, saya ingin konten post di-parse dan di-format dengan benar, sehingga konten yang ditulis Admin ditampilkan sesuai format aslinya.

#### Acceptance Criteria

1. WHEN konten Post mengandung line breaks, THE Platform SHALL mempertahankan format line breaks tersebut saat ditampilkan di Home_Page dan Gallery_Page
2. WHEN Telegram_Webhook menerima pesan dengan command `/cerita`, THE Parser SHALL memisahkan baris pertama sebagai title dan sisa teks sebagai content
3. FOR ALL Post yang disimpan dan kemudian ditampilkan, parsing lalu rendering konten SHALL menghasilkan output yang setara dengan input asli (round-trip property)
