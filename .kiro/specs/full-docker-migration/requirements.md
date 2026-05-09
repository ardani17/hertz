# Requirements Document

## Introduction

Dokumen ini mendefinisikan kebutuhan untuk migrasi penuh Horizon Trader Platform dari setup berbasis AAPanel ke setup yang sepenuhnya menggunakan Docker. Tujuannya adalah agar seluruh stack (Nginx, SSL, database, bot, frontend) berjalan di dalam Docker container tanpa ketergantungan pada paket atau panel manajemen apapun di host server — cukup Docker saja yang terinstall.

Saat ini, platform menggunakan AAPanel untuk mengelola Nginx reverse proxy dan sertifikat SSL (Let's Encrypt), sementara service aplikasi (Postgres, Bot, Frontend) sudah berjalan di Docker via `docker-compose.prod.yml`. Migrasi ini akan menghilangkan ketergantungan pada AAPanel sepenuhnya.

**Prinsip utama:** Semua nilai konfigurasi yang penting (port, key, token, domain, credential, dsb.) TIDAK BOLEH di-hardcode di file konfigurasi manapun. Semua harus bersumber dari file `.env`.

## Glossary

- **Nginx_Container**: Container Docker yang menjalankan Nginx sebagai reverse proxy dan SSL termination point untuk seluruh platform.
- **Certbot_Container**: Container Docker yang menjalankan Certbot untuk memperoleh dan memperbarui sertifikat SSL Let's Encrypt secara otomatis.
- **Deploy_Script**: Script bash (`deploy-docker.sh`) yang mengotomasi seluruh proses deployment dari awal hingga semua service berjalan dengan HTTPS.
- **Nginx_Config_Template**: File template konfigurasi Nginx yang menggunakan variabel environment (dari `.env`) untuk menentukan domain, port, rate limit, dan nilai konfigurasi lainnya — bukan nilai hardcoded.
- **Docker_Compose**: File `docker-compose.yml` yang mendefinisikan seluruh service stack dalam satu konfigurasi, dengan semua nilai konfigurasi merujuk ke variabel dari Env_File.
- **DB_Container**: Container Docker yang menjalankan PostgreSQL database.
- **Bot_Container**: Container Docker yang menjalankan Telegram bot service.
- **Frontend_Container**: Container Docker yang menjalankan Next.js frontend application.
- **SSL_Volume**: Docker volume bersama yang digunakan oleh Nginx_Container dan Certbot_Container untuk menyimpan sertifikat SSL.
- **ACME_Challenge_Volume**: Docker volume bersama untuk file ACME challenge yang digunakan dalam proses verifikasi domain Let's Encrypt.
- **Env_File**: File `.env` yang berisi SEMUA variabel konfigurasi platform — termasuk port, domain, credential, API key, dan parameter lainnya. Merupakan satu-satunya sumber kebenaran (single source of truth) untuk konfigurasi.
- **DB_Data_Dir**: Direktori di host server yang di-bind mount ke DB_Container untuk menyimpan data PostgreSQL. Memungkinkan backup database langsung dari host tanpa perlu masuk ke container.

## Requirements

### Requirement 1: Certbot Container untuk Manajemen SSL Otomatis

**User Story:** Sebagai DevOps engineer, saya ingin ada container Certbot di dalam Docker Compose, sehingga sertifikat SSL Let's Encrypt dapat diperoleh dan diperbarui secara otomatis tanpa intervensi manual.

#### Acceptance Criteria

1. THE Docker_Compose SHALL mendefinisikan Certbot_Container menggunakan image `certbot/certbot`.
2. THE Certbot_Container SHALL menggunakan SSL_Volume yang sama dengan Nginx_Container untuk menyimpan sertifikat di path `/etc/letsencrypt`.
3. THE Certbot_Container SHALL menggunakan ACME_Challenge_Volume yang sama dengan Nginx_Container untuk menyimpan file challenge di path `/var/www/certbot`.
4. THE Certbot_Container SHALL menjalankan proses renewal secara periodik setiap 12 jam menggunakan entrypoint command `certbot renew`.
5. WHEN sertifikat berhasil diperbarui, THE Deploy_Script SHALL memuat ulang konfigurasi Nginx_Container tanpa downtime menggunakan `nginx -s reload`.
6. IF Certbot_Container gagal memperoleh sertifikat, THEN THE Deploy_Script SHALL menampilkan pesan error yang deskriptif dan menghentikan proses deployment.

### Requirement 2: Konfigurasi Nginx Dinamis — Semua Nilai dari Environment Variable

**User Story:** Sebagai DevOps engineer, saya ingin SEMUA nilai penting di konfigurasi Nginx (domain, port upstream, rate limit) berasal dari file `.env`, sehingga tidak ada nilai yang di-hardcode dan konfigurasi dapat diubah tanpa mengedit file template.

#### Acceptance Criteria

1. THE Nginx_Config_Template SHALL menggunakan placeholder `${DOMAIN}` sebagai pengganti semua nilai domain yang di-hardcode (seperti `horizon.example.com` atau `horizon.cloudnexify.com`).
2. THE Nginx_Config_Template SHALL menggunakan placeholder `${FRONTEND_PORT}` untuk port internal Frontend_Container (menggantikan nilai hardcoded `3000`) pada definisi upstream.
3. THE Nginx_Config_Template SHALL menggunakan placeholder `${BOT_PORT}` untuk port internal Bot_Container (menggantikan nilai hardcoded `4000`) pada definisi upstream.
4. THE Nginx_Config_Template SHALL menggunakan placeholder `${NGINX_HTTP_PORT}` dan `${NGINX_HTTPS_PORT}` untuk port listen Nginx (menggantikan nilai hardcoded `80` dan `443`).
5. THE Nginx_Config_Template SHALL menggunakan placeholder `${NGINX_RATE_LIMIT_GENERAL}`, `${NGINX_RATE_LIMIT_API}`, dan `${NGINX_RATE_LIMIT_WEBHOOK}` untuk nilai rate limiting (menggantikan nilai hardcoded `30r/s`, `10r/s`, `5r/s`).
6. THE Nginx_Config_Template SHALL menyimpan path sertifikat SSL sebagai `/etc/letsencrypt/live/${DOMAIN}/fullchain.pem` dan `/etc/letsencrypt/live/${DOMAIN}/privkey.pem`.
7. WHEN Nginx_Container dimulai, THE Nginx_Container SHALL menjalankan `envsubst` untuk mengganti semua placeholder variabel dengan nilai aktual dari Env_File sebelum Nginx memuat konfigurasi.
8. THE Nginx_Container SHALL mempertahankan semua konfigurasi proxy yang ada: routing `/api/bot/` dan `/webhook/telegram` ke Bot_Container, serta semua route lainnya ke Frontend_Container.
9. IF variabel `DOMAIN` tidak didefinisikan di Env_File, THEN THE Deploy_Script SHALL menampilkan pesan error dan menghentikan proses deployment.

### Requirement 3: Deploy Script untuk Bare Server

**User Story:** Sebagai DevOps engineer, saya ingin satu script deployment yang menangani seluruh proses dari awal, sehingga saya bisa men-deploy platform di server baru yang hanya memiliki Docker terinstall.

#### Acceptance Criteria

1. THE Deploy_Script SHALL memvalidasi keberadaan file `.env` sebelum memulai proses deployment.
2. THE Deploy_Script SHALL memvalidasi bahwa SEMUA variabel wajib telah didefinisikan di Env_File (lihat Requirement 9 untuk daftar lengkap variabel wajib).
3. THE Deploy_Script SHALL SELALU melakukan build Docker image dengan flag `--no-cache` (`docker compose build --no-cache`) agar setiap deployment menggunakan image yang benar-benar fresh dan perubahan kode langsung tercermin.
4. WHEN dijalankan pertama kali (belum ada sertifikat SSL), THE Deploy_Script SHALL membuat sertifikat self-signed sementara agar Nginx_Container dapat dimulai.
5. WHEN semua container sudah berjalan, THE Deploy_Script SHALL meminta sertifikat Let's Encrypt yang valid melalui Certbot_Container menggunakan metode webroot.
6. WHEN sertifikat Let's Encrypt berhasil diperoleh, THE Deploy_Script SHALL mengganti sertifikat self-signed dengan sertifikat Let's Encrypt dan memuat ulang Nginx_Container.
7. THE Deploy_Script SHALL menampilkan status health check untuk setiap service (DB_Container, Bot_Container, Frontend_Container, Nginx_Container) setelah deployment selesai.
8. IF proses build Docker image gagal, THEN THE Deploy_Script SHALL menghentikan deployment dan menampilkan log error.
9. THE Deploy_Script SHALL dapat dijalankan ulang dengan aman (idempotent) tanpa merusak data atau sertifikat yang sudah ada.

### Requirement 4: Keamanan Port — Tidak Ada Port yang Terekspos ke Host Kecuali HTTP/HTTPS

**User Story:** Sebagai DevOps engineer, saya ingin hanya port HTTP dan HTTPS yang terekspos ke host, sehingga database dan service internal tidak dapat diakses langsung dari luar.

#### Acceptance Criteria

1. THE DB_Container SHALL berkomunikasi dengan container lain hanya melalui Docker network internal (`horizon-net`) tanpa mapping port ke host.
2. THE Bot_Container SHALL berkomunikasi dengan Nginx_Container hanya melalui Docker network internal tanpa mapping port ke host.
3. THE Frontend_Container SHALL berkomunikasi dengan Nginx_Container hanya melalui Docker network internal tanpa mapping port ke host.
4. THE Nginx_Container SHALL menjadi satu-satunya container yang memetakan port ke host, yaitu port `${NGINX_HTTP_PORT}` dan `${NGINX_HTTPS_PORT}` sesuai nilai dari Env_File.
5. THE Docker_Compose SHALL menggunakan directive `expose` (bukan `ports`) untuk DB_Container, Bot_Container, dan Frontend_Container.

### Requirement 5: Mekanisme Auto-Renewal Sertifikat SSL

**User Story:** Sebagai DevOps engineer, saya ingin sertifikat SSL diperbarui secara otomatis, sehingga website tidak pernah mengalami downtime karena sertifikat expired.

#### Acceptance Criteria

1. THE Certbot_Container SHALL menjalankan perintah `certbot renew` secara otomatis setiap 12 jam.
2. WHEN sertifikat berhasil diperbarui, THE Certbot_Container SHALL memicu reload konfigurasi Nginx_Container.
3. THE Certbot_Container SHALL berjalan dengan restart policy `unless-stopped` agar tetap aktif setelah server reboot.
4. WHILE sertifikat masih valid (belum mendekati masa expired), THE Certbot_Container SHALL melewati proses renewal tanpa melakukan perubahan apapun.

### Requirement 6: File .env.example dengan Dokumentasi Lengkap untuk Semua Konfigurasi

**User Story:** Sebagai developer, saya ingin file `.env.example` mendokumentasikan SEMUA variabel konfigurasi yang diperlukan platform, sehingga saya tahu persis apa yang harus dikonfigurasi dan tidak ada nilai yang terlewat.

#### Acceptance Criteria

1. THE Env_File SHALL mendefinisikan section **Database** dengan variabel: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, dan `DATABASE_URL` — masing-masing dengan contoh nilai dan komentar penjelasan.
2. THE Env_File SHALL mendefinisikan section **Telegram Bot** dengan variabel: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_NAME`, `TELEGRAM_GROUP_ID`, dan `TELEGRAM_WEBHOOK_URL` — dimana `TELEGRAM_WEBHOOK_URL` harus menggunakan komentar yang menjelaskan bahwa nilainya dikonstruksi dari variabel `DOMAIN` (contoh: `https://<DOMAIN>/webhook/telegram`).
3. THE Env_File SHALL mendefinisikan section **Cloudflare R2** dengan variabel: `R2_ENDPOINT`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, dan `R2_PUBLIC_URL`.
4. THE Env_File SHALL mendefinisikan section **Admin Credentials** dengan variabel: `ADMIN_USERNAME` dan `ADMIN_PASSWORD` beserta komentar bahwa ini adalah credential untuk initial seed.
5. THE Env_File SHALL mendefinisikan section **Service Ports** dengan variabel: `FRONTEND_PORT` (default: `3000`), `BOT_PORT` (default: `4000`), `NGINX_HTTP_PORT` (default: `80`), dan `NGINX_HTTPS_PORT` (default: `443`) — masing-masing dengan komentar penjelasan.
6. THE Env_File SHALL mendefinisikan section **Domain & SSL** dengan variabel: `DOMAIN`, `SSL_EMAIL`, `FRONTEND_URL`, dan `NEXT_PUBLIC_SITE_URL` — dimana `FRONTEND_URL` dan `NEXT_PUBLIC_SITE_URL` harus menggunakan komentar yang menjelaskan bahwa nilainya dikonstruksi dari `DOMAIN`.
7. THE Env_File SHALL mendefinisikan section **Nginx Rate Limiting** dengan variabel: `NGINX_RATE_LIMIT_GENERAL` (default: `30r/s`), `NGINX_RATE_LIMIT_API` (default: `10r/s`), dan `NGINX_RATE_LIMIT_WEBHOOK` (default: `5r/s`).
8. THE Env_File SHALL mendefinisikan section **Application** dengan variabel: `NODE_ENV`.
9. THE Env_File SHALL menghapus semua referensi ke port AAPanel (`3888`, `4888`) dan domain hardcoded (`horizon.cloudnexify.com`).
10. THE Env_File SHALL menyertakan komentar header di setiap section yang menjelaskan tujuan section tersebut.

### Requirement 7: Kompatibilitas Bare Server

**User Story:** Sebagai DevOps engineer, saya ingin seluruh stack dapat berjalan di server baru yang hanya memiliki Docker dan Docker Compose terinstall, tanpa perlu menginstall paket tambahan apapun.

#### Acceptance Criteria

1. THE Docker_Compose SHALL mendefinisikan semua service yang diperlukan (DB_Container, Bot_Container, Frontend_Container, Nginx_Container, Certbot_Container) dalam satu file.
2. THE Deploy_Script SHALL tidak memerlukan tool tambahan selain `docker` dan `docker compose` yang sudah tersedia di host.
3. THE Docker_Compose SHALL menggunakan named volumes untuk persistensi data database (`pgdata`) dan sertifikat SSL.
4. WHEN server di-reboot, THE Docker_Compose SHALL memastikan semua container dimulai ulang secara otomatis melalui restart policy `unless-stopped`.
5. THE Deploy_Script SHALL menyertakan instruksi atau output yang jelas tentang langkah selanjutnya setelah deployment berhasil (misalnya: setup DNS, verifikasi HTTPS).

### Requirement 8: Konfigurasi Nginx Reverse Proxy yang Lengkap

**User Story:** Sebagai DevOps engineer, saya ingin konfigurasi Nginx di Docker memiliki semua fitur yang sama dengan setup AAPanel saat ini, sehingga tidak ada fungsionalitas yang hilang setelah migrasi.

#### Acceptance Criteria

1. THE Nginx_Container SHALL melakukan redirect semua traffic HTTP ke HTTPS, kecuali untuk path `/.well-known/acme-challenge/` yang digunakan oleh Certbot.
2. THE Nginx_Container SHALL mem-proxy route `/api/bot/` dan `/webhook/telegram` ke Bot_Container pada port yang ditentukan oleh variabel `${BOT_PORT}` dari Env_File.
3. THE Nginx_Container SHALL mem-proxy semua route lainnya (termasuk `/admin`, `/api/credit/`, `/_next/static/`, `/_next/image`) ke Frontend_Container pada port yang ditentukan oleh variabel `${FRONTEND_PORT}` dari Env_File.
4. THE Nginx_Container SHALL menerapkan rate limiting sesuai nilai dari Env_File: `${NGINX_RATE_LIMIT_GENERAL}` untuk traffic umum, `${NGINX_RATE_LIMIT_API}` untuk API, dan `${NGINX_RATE_LIMIT_WEBHOOK}` untuk webhook.
5. THE Nginx_Container SHALL mengaktifkan gzip compression untuk tipe konten text, CSS, JavaScript, JSON, XML, dan SVG.
6. THE Nginx_Container SHALL menambahkan security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, dan `Strict-Transport-Security`.
7. THE Nginx_Container SHALL menerapkan caching header `Cache-Control: public, max-age=31536000, immutable` untuk static assets di path `/_next/static/`.
8. THE Nginx_Container SHALL menyediakan endpoint `/health` yang mengembalikan status 200 pada port HTTP untuk Docker health check.

### Requirement 9: Validasi Konfigurasi Environment Variable

**User Story:** Sebagai DevOps engineer, saya ingin deploy script memvalidasi bahwa semua variabel environment yang diperlukan sudah diisi dengan benar, sehingga deployment tidak gagal di tengah jalan karena konfigurasi yang kurang.

#### Acceptance Criteria

1. WHEN Deploy_Script dijalankan, THE Deploy_Script SHALL memeriksa bahwa SEMUA variabel wajib berikut telah didefinisikan dan tidak kosong di Env_File: `DOMAIN`, `SSL_EMAIL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
2. IF satu atau lebih variabel wajib tidak didefinisikan atau kosong, THEN THE Deploy_Script SHALL menampilkan daftar lengkap variabel yang belum diisi dan menghentikan proses deployment.
3. THE Deploy_Script SHALL memvalidasi bahwa variabel `DOMAIN` tidak mengandung placeholder default seperti `yourdomain.com` atau `example.com`.
4. THE Deploy_Script SHALL memvalidasi bahwa variabel `ADMIN_PASSWORD` tidak mengandung nilai default atau placeholder seperti `admin123`, `password`, atau `GANTI_PASSWORD`.
5. THE Deploy_Script SHALL mengkonstruksi nilai `DATABASE_URL` secara otomatis dari variabel `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST` (default: `db`), `POSTGRES_PORT` (default: `5432`), dan `POSTGRES_DB` — sehingga user tidak perlu mengisi `DATABASE_URL` secara manual.
6. THE Deploy_Script SHALL mengkonstruksi nilai `TELEGRAM_WEBHOOK_URL` secara otomatis dari variabel `DOMAIN` (format: `https://${DOMAIN}/webhook/telegram`) — sehingga user tidak perlu mengisi webhook URL secara manual.
7. THE Deploy_Script SHALL mengkonstruksi nilai `FRONTEND_URL` dan `NEXT_PUBLIC_SITE_URL` secara otomatis dari variabel `DOMAIN` (format: `https://${DOMAIN}`) — sehingga user tidak perlu mengisi URL secara manual.
8. WHEN variabel opsional (seperti port dan rate limit) tidak didefinisikan, THE Deploy_Script SHALL menggunakan nilai default yang wajar: `FRONTEND_PORT=3000`, `BOT_PORT=4000`, `NGINX_HTTP_PORT=80`, `NGINX_HTTPS_PORT=443`, `NGINX_RATE_LIMIT_GENERAL=30r/s`, `NGINX_RATE_LIMIT_API=10r/s`, `NGINX_RATE_LIMIT_WEBHOOK=5r/s`.

### Requirement 10: Zero Hardcoded Values di Seluruh File Konfigurasi

**User Story:** Sebagai DevOps engineer, saya ingin tidak ada satupun nilai konfigurasi penting yang di-hardcode di file konfigurasi manapun, sehingga semua konfigurasi terpusat di satu file `.env` dan mudah dikelola.

#### Acceptance Criteria

1. THE Docker_Compose SHALL mereferensikan semua port service menggunakan variabel dari Env_File: `${FRONTEND_PORT}`, `${BOT_PORT}`, `${NGINX_HTTP_PORT}`, `${NGINX_HTTPS_PORT}`, dan `${POSTGRES_PORT}`.
2. THE Docker_Compose SHALL mereferensikan semua credential dan token menggunakan variabel dari Env_File: `${TELEGRAM_BOT_TOKEN}`, `${R2_ACCESS_KEY_ID}`, `${R2_SECRET_ACCESS_KEY}`, `${ADMIN_USERNAME}`, `${ADMIN_PASSWORD}`, dan credential database.
3. THE Docker_Compose SHALL TIDAK mengandung domain hardcoded seperti `horizon.cloudnexify.com` atau `horizon.example.com` — semua URL harus dikonstruksi dari variabel `${DOMAIN}`.
4. THE Nginx_Config_Template SHALL TIDAK mengandung nilai port hardcoded (`3000`, `4000`, `80`, `443`) — semua harus menggunakan placeholder variabel.
5. THE Nginx_Config_Template SHALL TIDAK mengandung domain hardcoded — semua harus menggunakan placeholder `${DOMAIN}`.
6. THE Nginx_Config_Template SHALL TIDAK mengandung nilai rate limit hardcoded (`30r/s`, `10r/s`, `5r/s`) — semua harus menggunakan placeholder variabel.
7. THE Docker_Compose SHALL mengkonstruksi `DATABASE_URL` dari variabel individual (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`) bukan dari string hardcoded.
8. THE Docker_Compose SHALL TIDAK mengandung port mapping AAPanel (`3888`, `4888`) atau referensi ke AAPanel dalam bentuk apapun.

### Requirement 11: Bind Mount Volume Database untuk Kemudahan Backup

**User Story:** Sebagai DevOps engineer, saya ingin data PostgreSQL disimpan di direktori host yang mudah diakses (bind mount), sehingga saya bisa melakukan backup database dengan mudah — cukup copy folder dari host tanpa perlu masuk ke container.

#### Acceptance Criteria

1. THE Docker_Compose SHALL menggunakan bind mount (bukan named volume) untuk data PostgreSQL, memetakan direktori host ke `/var/lib/postgresql/data` di dalam DB_Container.
2. THE Env_File SHALL mendefinisikan variabel `DB_DATA_DIR` yang menentukan path direktori host untuk menyimpan data PostgreSQL (default: `./data/postgres`).
3. THE Docker_Compose SHALL mereferensikan variabel `${DB_DATA_DIR}` untuk path bind mount volume database.
4. WHEN Deploy_Script dijalankan, THE Deploy_Script SHALL membuat direktori `${DB_DATA_DIR}` secara otomatis jika belum ada, dengan permission yang sesuai.
5. THE Env_File SHALL mendefinisikan variabel `DB_DATA_DIR` di section **Database** dengan komentar penjelasan bahwa direktori ini berisi data PostgreSQL dan dapat di-backup langsung dari host.
6. THE Docker_Compose SHALL tetap menggunakan named volume atau bind mount untuk sertifikat SSL (`./certbot/conf`) agar tidak tercampur dengan data database.
