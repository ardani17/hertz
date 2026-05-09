# Implementation Plan: Full Docker Migration

## Overview

Migrasi penuh Horizon Trader Platform dari setup AAPanel ke Docker-only. Implementasi mencakup: rewrite `docker-compose.yml`, Nginx config templates dengan envsubst, deploy script baru (`deploy-docker.sh`), Certbot container untuk SSL otomatis, dan comprehensive `.env.example`. File lama yang tidak diperlukan akan dihapus di akhir.

## Tasks

- [x] 1. Update `.env.example` dengan semua variabel konfigurasi
  - [x] 1.1 Rewrite `.env.example` dengan section lengkap: Database, Domain & SSL, Telegram Bot, Cloudflare R2, Admin Credentials, Service Ports, Nginx Rate Limiting, Application
    - Tambahkan variabel baru: `DB_DATA_DIR`, `FRONTEND_PORT`, `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT`, `NGINX_RATE_LIMIT_GENERAL`, `NGINX_RATE_LIMIT_API`, `NGINX_RATE_LIMIT_WEBHOOK`
    - Hapus semua referensi ke port AAPanel (`3888`, `4888`) dan domain hardcoded (`horizon.cloudnexify.com`)
    - Tambahkan komentar header di setiap section dan komentar penjelasan per variabel
    - Tandai variabel auto-constructed (`DATABASE_URL`, `TELEGRAM_WEBHOOK_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_SITE_URL`) dengan komentar bahwa nilainya dikonstruksi otomatis oleh deploy script
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 10.1, 10.2, 11.2, 11.5_

- [x] 2. Buat Nginx config templates dengan envsubst
  - [x] 2.1 Buat `nginx/templates/default.conf.template` dari `nginx/conf.d/default.conf`
    - Ganti semua domain hardcoded (`horizon.example.com`) dengan `${DOMAIN}`
    - Ganti port upstream hardcoded (`3000`, `4000`) dengan `${FRONTEND_PORT}` dan `${BOT_PORT}`
    - Pertahankan semua routing rules: `/api/bot/`, `/webhook/telegram` → bot; semua lainnya → frontend
    - Pertahankan security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`
    - Pertahankan caching headers untuk `/_next/static/` (immutable, 1 year) dan `/_next/image` (30 days)
    - Pertahankan HTTP → HTTPS redirect kecuali `/.well-known/acme-challenge/`
    - Pertahankan `/health` endpoint pada port HTTP
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.8, 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8, 10.4, 10.5_

  - [x] 2.2 Update `nginx/nginx.conf` untuk menggunakan variabel rate limit
    - Ganti hardcoded rate limit values (`30r/s`, `10r/s`, `5r/s`) dengan placeholder `${NGINX_RATE_LIMIT_GENERAL}`, `${NGINX_RATE_LIMIT_API}`, `${NGINX_RATE_LIMIT_WEBHOOK}`
    - File ini akan di-process oleh custom entrypoint, bukan built-in envsubst
    - _Requirements: 2.5, 2.7, 8.4, 10.6_

  - [x] 2.3 Buat `nginx/docker-entrypoint.sh` — wrapper script untuk envsubst pada `nginx.conf`
    - Jalankan `envsubst` untuk variabel rate limit (`${NGINX_RATE_LIMIT_GENERAL}`, `${NGINX_RATE_LIMIT_API}`, `${NGINX_RATE_LIMIT_WEBHOOK}`) pada `nginx.conf`
    - Delegasikan ke default Nginx entrypoint (`/docker-entrypoint.sh "$@"`) untuk handle `templates/` directory
    - Set file sebagai executable
    - _Requirements: 2.5, 2.7_

- [x] 3. Checkpoint — Verifikasi template files
  - Pastikan semua file template sudah benar, tidak ada hardcoded values tersisa. Tanyakan ke user jika ada pertanyaan.

- [x] 4. Rewrite `docker-compose.yml` untuk full Docker stack
  - [x] 4.1 Update service `db` — bind mount dan hapus port mapping
    - Ganti named volume `pgdata` dengan bind mount `${DB_DATA_DIR:-./data/postgres}:/var/lib/postgresql/data`
    - Hapus `ports` directive, ganti dengan `expose: ["${POSTGRES_PORT:-5432}"]`
    - Gunakan variabel dari `.env` untuk semua environment values
    - _Requirements: 4.1, 4.5, 5.4 (restart policy), 10.1, 10.2, 11.1, 11.3_

  - [x] 4.2 Update service `bot` — hapus port mapping, auto-construct env vars
    - Hapus `ports` directive, gunakan `expose: ["${BOT_PORT:-4000}"]`
    - Auto-construct `DATABASE_URL` dari variabel individual: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}`
    - Auto-construct `TELEGRAM_WEBHOOK_URL`: `https://${DOMAIN}/webhook/telegram`
    - Gunakan variabel `${BOT_PORT:-4000}` untuk `BOT_PORT` environment
    - _Requirements: 4.2, 4.5, 9.5, 9.6, 10.1, 10.2, 10.3, 10.7, 10.8_

  - [x] 4.3 Update service `frontend` — hapus port mapping, auto-construct env vars
    - Hapus `ports` directive, gunakan `expose: ["${FRONTEND_PORT:-3000}"]`
    - Auto-construct `DATABASE_URL` dari variabel individual
    - Auto-construct `NEXT_PUBLIC_SITE_URL` dan `FRONTEND_URL`: `https://${DOMAIN}`
    - _Requirements: 4.3, 4.5, 9.5, 9.7, 10.1, 10.2, 10.3, 10.7, 10.8_

  - [x] 4.4 Update service `nginx` — tambah template volumes, custom entrypoint, port mapping dari env
    - Port mapping: `${NGINX_HTTP_PORT:-80}:80` dan `${NGINX_HTTPS_PORT:-443}:443`
    - Mount `./nginx/nginx.conf` sebagai `/etc/nginx/nginx.conf.template:ro` (untuk custom entrypoint)
    - Mount `./nginx/templates/` ke `/etc/nginx/templates/:ro` (untuk built-in envsubst)
    - Mount `./certbot/conf:/etc/letsencrypt:ro` dan `./certbot/www:/var/www/certbot:ro`
    - Mount `./nginx/docker-entrypoint.sh` sebagai custom entrypoint
    - Pass environment variables: `DOMAIN`, `FRONTEND_PORT`, `BOT_PORT`, `NGINX_RATE_LIMIT_*`
    - Depends on: `frontend` (healthy), `bot` (healthy)
    - _Requirements: 2.4, 2.7, 4.4, 4.5, 8.1, 8.2, 8.3, 10.1, 10.4, 10.5, 10.6_

  - [x] 4.5 Tambah service `certbot` — SSL management container
    - Image: `certbot/certbot`
    - Volumes: `./certbot/conf:/etc/letsencrypt`, `./certbot/www:/var/www/certbot`
    - Entrypoint: renewal loop setiap 12 jam dengan `certbot renew`
    - Restart policy: `unless-stopped`
    - Depends on: `nginx`
    - Network: `horizon-net`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 7.1_

  - [x] 4.6 Update volumes dan networks section
    - Hapus named volume `pgdata` (diganti bind mount)
    - Pertahankan network `horizon-net`
    - Pastikan SSL volumes menggunakan bind mount (`./certbot/conf`, `./certbot/www`)
    - _Requirements: 7.3, 11.1, 11.6_

- [x] 5. Checkpoint — Verifikasi docker-compose.yml
  - Pastikan tidak ada hardcoded values, semua port mapping benar, dependency chain lengkap. Tanyakan ke user jika ada pertanyaan.

- [x] 6. Buat `deploy-docker.sh` — deploy script untuk bare server
  - [x] 6.1 Implementasi fungsi `validate_env()` dan `check_required_vars()`
    - Cek keberadaan file `.env`
    - Validasi semua variabel wajib: `DOMAIN`, `SSL_EMAIL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
    - Validasi `DOMAIN` tidak mengandung placeholder (`yourdomain.com`, `example.com`)
    - Validasi `ADMIN_PASSWORD` tidak mengandung default (`admin123`, `password`, `GANTI_PASSWORD`)
    - Tampilkan daftar lengkap variabel yang kurang jika validasi gagal
    - _Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4_

  - [x] 6.2 Implementasi fungsi `auto_construct_vars()` dan `set_defaults()`
    - Konstruksi `DATABASE_URL` dari variabel individual
    - Konstruksi `TELEGRAM_WEBHOOK_URL` dari `DOMAIN`
    - Konstruksi `FRONTEND_URL` dan `NEXT_PUBLIC_SITE_URL` dari `DOMAIN`
    - Set defaults: `FRONTEND_PORT=3000`, `BOT_PORT=4000`, `NGINX_HTTP_PORT=80`, `NGINX_HTTPS_PORT=443`, rate limits
    - Set default `DB_DATA_DIR=./data/postgres`
    - _Requirements: 9.5, 9.6, 9.7, 9.8_

  - [x] 6.3 Implementasi fungsi `setup_directories()` dan `generate_self_signed()`
    - Buat direktori: `${DB_DATA_DIR}`, `./certbot/conf`, `./certbot/www`
    - Generate self-signed certificate jika belum ada sertifikat di `./certbot/conf/live/${DOMAIN}/`
    - Gunakan `openssl req -x509` untuk self-signed cert
    - _Requirements: 3.4, 3.9, 11.4_

  - [x] 6.4 Implementasi fungsi `build_and_start()`
    - Jalankan `docker compose build --no-cache` — selalu fresh build
    - Jalankan `docker compose up -d`
    - Hentikan deployment jika build gagal, tampilkan error
    - _Requirements: 3.3, 3.8_

  - [x] 6.5 Implementasi fungsi `request_letsencrypt()` dan nginx reload
    - Minta sertifikat Let's Encrypt via certbot container menggunakan webroot method
    - Ganti self-signed cert dengan Let's Encrypt cert
    - Reload Nginx: `docker exec horizon-nginx nginx -s reload`
    - Tampilkan warning jika SSL gagal (site tetap berjalan dengan self-signed)
    - _Requirements: 1.5, 1.6, 3.5, 3.6, 5.2_

  - [x] 6.6 Implementasi fungsi `health_check()` dan output akhir
    - Cek status health untuk semua service: db, bot, frontend, nginx
    - Tampilkan report status per service
    - Tampilkan instruksi langkah selanjutnya (DNS setup, verifikasi HTTPS)
    - _Requirements: 3.7, 7.2, 7.5_

- [x] 7. Checkpoint — Verifikasi deploy script
  - Pastikan deploy script lengkap dan idempotent. Pastikan script hanya membutuhkan `docker` dan `docker compose`. Tanyakan ke user jika ada pertanyaan.

- [x] 8. Hapus file lama dan finalisasi
  - [x] 8.1 Hapus file yang tidak diperlukan lagi
    - Hapus `docker-compose.prod.yml` (digantikan oleh `docker-compose.yml`)
    - Hapus `deploy.sh` (digantikan oleh `deploy-docker.sh`)
    - Hapus `nginx/init-ssl.sh` (fungsionalitas diintegrasikan ke deploy script)
    - Hapus `nginx/conf.d/default.conf` (dipindah ke `nginx/templates/default.conf.template`)
    - _Requirements: 10.8 (hapus referensi AAPanel)_

  - [x] 8.2 Verifikasi zero hardcoded values di seluruh file
    - Pastikan tidak ada domain hardcoded (`horizon.cloudnexify.com`, `horizon.example.com`)
    - Pastikan tidak ada port AAPanel (`3888`, `4888`)
    - Pastikan tidak ada rate limit hardcoded di config files
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 9. Final checkpoint — Pastikan semua file konsisten
  - Pastikan semua file baru dan yang dimodifikasi konsisten satu sama lain. Pastikan semua requirements tercakup. Tanyakan ke user jika ada pertanyaan.

## Notes

- Semua konfigurasi bersumber dari `.env` — zero hardcoded values
- Deploy script idempotent, aman dijalankan berulang kali
- Hanya port 80/443 yang terekspos ke host
- Database menggunakan bind mount untuk kemudahan backup
- Certbot auto-renewal setiap 12 jam
- Setiap task mereferensikan requirements spesifik untuk traceability
