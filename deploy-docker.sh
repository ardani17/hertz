#!/bin/bash
# ============================================
# HERTZ Platform — Docker Deploy Script
#
# Deploy seluruh stack di bare server yang hanya
# membutuhkan Docker dan Docker Compose.
#
# Usage: bash deploy-docker.sh
# ============================================

set -e

# ── Colors & helpers ────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

banner() {
    echo ""
    echo "=========================================="
    echo "  HERTZ Platform — Docker Deploy"
    echo "=========================================="
    echo ""
}

# ── Detect docker compose command ───────────

detect_compose() {
    if docker compose version >/dev/null 2>&1; then
        COMPOSE="docker compose"
    elif docker-compose version >/dev/null 2>&1; then
        COMPOSE="docker-compose"
    else
        err "Docker Compose tidak ditemukan!"
        echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    ok "Menggunakan: $COMPOSE"
}

# ── 1. validate_env ─────────────────────────

validate_env() {
    info "Memeriksa file .env ..."

    if [ ! -f .env ]; then
        err "File .env tidak ditemukan!"
        echo "  Copy .env.example ke .env dan isi semua nilai yang diperlukan:"
        echo "    cp .env.example .env"
        exit 1
    fi

    # shellcheck disable=SC1091
    set -a
    source .env
    set +a

    ok "File .env ditemukan dan dimuat."
}

# ── 2. check_required_vars ──────────────────

check_required_vars() {
    info "Memvalidasi variabel wajib ..."

    local required_vars=(
        DOMAIN
        POSTGRES_DB
        POSTGRES_USER
        POSTGRES_PASSWORD
        TELEGRAM_BOT_TOKEN
        R2_ACCESS_KEY_ID
        R2_SECRET_ACCESS_KEY
        R2_BUCKET_NAME
        ADMIN_USERNAME
        ADMIN_PASSWORD
    )

    local missing=()

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing+=("$var")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        err "Variabel wajib berikut belum diisi di .env:"
        for var in "${missing[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi

    # Validasi DOMAIN tidak mengandung placeholder
    case "$DOMAIN" in
        *yourdomain.com*|*example.com*)
            err "DOMAIN masih mengandung placeholder: $DOMAIN"
            echo "  Ganti dengan domain asli Anda di file .env"
            exit 1
            ;;
    esac

    # Validasi ADMIN_PASSWORD tidak mengandung default
    case "$ADMIN_PASSWORD" in
        *admin123*|*password*|*GANTI_PASSWORD*)
            err "ADMIN_PASSWORD masih menggunakan nilai default: $ADMIN_PASSWORD"
            echo "  Ganti dengan password yang kuat di file .env"
            exit 1
            ;;
    esac

    if [ -z "${MEMBERSHIP_CHECK_URL}" ] || [ -z "${MEMBERSHIP_CHECK_TOKEN}" ] || [ -z "${MEMBER_SESSION_SECRET}" ]; then
        err "HERTZ membutuhkan MEMBERSHIP_CHECK_URL, MEMBERSHIP_CHECK_TOKEN, dan MEMBER_SESSION_SECRET."
        exit 1
    fi

    if [ -z "${HERTZ_MEMBERSHIP_GROUP_ID:-${TELEGRAM_GROUP_ID}}" ]; then
        err "HERTZ membutuhkan HERTZ_MEMBERSHIP_GROUP_ID atau TELEGRAM_GROUP_ID."
        exit 1
    fi

    if [ -n "${HORIZON_TELEGRAM_GROUP_ID:-}" ]; then
        err "HORIZON_TELEGRAM_GROUP_ID sudah tidak didukung. Gunakan HERTZ_MEMBERSHIP_GROUP_ID."
        exit 1
    fi

    export PUSH_PROVIDER="${PUSH_PROVIDER:-expo}"
    if [ "${PUSH_PROVIDER}" = "expo" ] && { [ -z "${EXPO_ACCESS_TOKEN:-}" ] || [ "${EXPO_ACCESS_TOKEN}" = "your_expo_access_token_here" ]; }; then
        warn "PUSH_PROVIDER=expo tetapi EXPO_ACCESS_TOKEN belum diisi. Push delivery tetap dicatat, receipt query mungkin terbatas."
    fi

    export MOBILE_DEEP_LINK_SCHEME="${MOBILE_DEEP_LINK_SCHEME:-hertz}"
    export MOBILE_APP_BUNDLE_ID_IOS="${MOBILE_APP_BUNDLE_ID_IOS:-com.hertz.app}"
    export MOBILE_APP_PACKAGE_ANDROID="${MOBILE_APP_PACKAGE_ANDROID:-com.hertz.app}"
    export MOBILE_MIN_APP_VERSION="${MOBILE_MIN_APP_VERSION:-1.0.0}"
    export MOBILE_HANDOFF_NONCE_TTL_SECONDS="${MOBILE_HANDOFF_NONCE_TTL_SECONDS:-300}"
    export RATE_LIMITER_BACKEND="${RATE_LIMITER_BACKEND:-redis}"

    ok "Semua variabel wajib tervalidasi."
}

# ── 3. auto_construct_vars ──────────────────

auto_construct_vars() {
    info "Mengkonstruksi variabel otomatis ..."

    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}"
    export TELEGRAM_WEBHOOK_URL="https://${DOMAIN}/webhook/telegram"
    export FRONTEND_URL="https://${DOMAIN}"
    export NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
    export HERTZ_MEMBERSHIP_GROUP_ID="${HERTZ_MEMBERSHIP_GROUP_ID:-${TELEGRAM_GROUP_ID}}"

    ok "DATABASE_URL       = postgresql://${POSTGRES_USER}:****@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB}"
    ok "TELEGRAM_WEBHOOK_URL = ${TELEGRAM_WEBHOOK_URL}"
    ok "FRONTEND_URL       = ${FRONTEND_URL}"
    ok "NEXT_PUBLIC_SITE_URL = ${NEXT_PUBLIC_SITE_URL}"
    ok "HERTZ_MEMBERSHIP_GROUP_ID = ${HERTZ_MEMBERSHIP_GROUP_ID}"
}

# ── 3b. wave4_logout_notice ──────────────────

wave4_logout_notice() {
    warn "Wave 4 sunset legacy session aktif: cookie horizon_* tidak lagi berlaku."
    warn "Deploy disarankan pada low-traffic window karena user lama akan login ulang."
}

# ── 4. set_defaults ─────────────────────────

set_defaults() {
    info "Menetapkan nilai default untuk variabel opsional ..."

    export FRONTEND_PORT="${FRONTEND_PORT:-3000}"
    export BOT_PORT="${BOT_PORT:-4000}"
    export HERTZ_PLATFORM_ENABLED="${HERTZ_PLATFORM_ENABLED:-true}"

    export DB_DATA_DIR="${DB_DATA_DIR:-/www/dk_project/hertz/data/postgres}"

    ok "Defaults: FRONTEND_PORT=${FRONTEND_PORT}, BOT_PORT=${BOT_PORT}"
    ok "Defaults: HERTZ_PLATFORM_ENABLED=${HERTZ_PLATFORM_ENABLED}"
    ok "Defaults: DB_DATA_DIR=${DB_DATA_DIR}"
}

# ── 5. setup_directories ───────────────────

setup_directories() {
    info "Membuat direktori yang diperlukan ..."

    mkdir -p "${DB_DATA_DIR}"

    ok "Direktori siap: ${DB_DATA_DIR}"
}

# ── 6. validate_deploy_assets ───────────────

validate_deploy_assets() {
    info "Memvalidasi asset deploy ..."
    ok "Tidak ada asset tools statis tambahan yang wajib masuk Docker build context."
}

# ── 7. build_and_start ──────────────────────

build_and_start() {
    info "Building Docker images (--no-cache) ..."

    if ! $COMPOSE build --no-cache; then
        err "Docker build gagal! Periksa log di atas untuk detail error."
        exit 1
    fi

    ok "Build selesai."

    info "Membersihkan container HERTZ lama ..."
    local hertz_containers=(hertz-frontend hertz-bot hertz-db hertz-redis)
    for ctr in "${hertz_containers[@]}"; do
        docker rm -f "$ctr" 2>/dev/null || true
    done
    $COMPOSE down --remove-orphans 2>/dev/null || true

    info "Menjalankan semua service ..."
    if ! $COMPOSE up -d; then
        err "Gagal memulai container. Cek: docker ps -a && docker network inspect hertz-net"
        exit 1
    fi

    ok "Semua container dimulai."
}

# ── 8. run_migrations ───────────────────────

run_migrations() {
    info "Menjalankan database migrations ..."

    # Wait for db to be healthy first
    local max_wait=30
    for i in $(seq 1 "$max_wait"); do
        local status
        status=$(docker inspect --format='{{.State.Health.Status}}' hertz-db 2>/dev/null || echo "unknown")
        if [ "$status" = "healthy" ]; then
            break
        fi
        sleep 2
    done

    # Run init.sh inside the db container (it skips already-applied migrations)
    if docker exec \
        -e POSTGRES_USER="${POSTGRES_USER}" \
        -e POSTGRES_DB="${POSTGRES_DB}" \
        -e ADMIN_USERNAME="${ADMIN_USERNAME}" \
        -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
        -e MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations" \
        hertz-db bash /docker-entrypoint-initdb.d/init.sh; then
        ok "Migrations selesai."
    else
        err "Migration gagal — periksa log di atas."
        exit 1
    fi
}

# ── 9. health_check ─────────────────────────

health_check() {
    echo ""
    info "Menjalankan health check ..."
    echo ""

    local services=("db" "redis" "bot" "frontend")
    local containers=("hertz-db" "hertz-redis" "hertz-bot" "hertz-frontend")
    local max_retries=30
    local all_healthy=true

    for i in "${!services[@]}"; do
        local svc="${services[$i]}"
        local ctr="${containers[$i]}"
        local healthy=false

        echo -n "  ${svc}: "

        for attempt in $(seq 1 "$max_retries"); do
            local status
            status=$(docker inspect --format='{{.State.Health.Status}}' "$ctr" 2>/dev/null || echo "unknown")

            if [ "$status" = "healthy" ]; then
                healthy=true
                break
            fi
            sleep 2
        done

        if $healthy; then
            echo -e "${GREEN}✅ Healthy${NC}"
        else
            echo -e "${RED}❌ Not healthy${NC} (cek: docker logs ${ctr})"
            all_healthy=false
        fi
    done

    echo ""
    echo "=========================================="

    if $all_healthy; then
        echo -e "  ${GREEN}✅ Deploy berhasil! Semua service healthy.${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Deploy selesai, tapi ada service yang belum healthy.${NC}"
        echo "  Periksa log container yang bermasalah."
    fi

    echo ""
    echo "  Langkah selanjutnya:"
    echo "  0. Pastikan host reverse proxy sudah berjalan (lihat proxy/README.md)"
    echo "  1. Pastikan DNS A record untuk ${DOMAIN} mengarah ke IP server ini"
    echo "  2. Verifikasi HTTPS: https://${DOMAIN}"
    echo "  3. Cek admin panel: https://${DOMAIN}/admin"
    echo "  4. Cek bot status: https://${DOMAIN}/api/bot/status"
    echo ""
    echo "=========================================="
    echo ""
}

# ── Main ────────────────────────────────────

main() {
    banner
    detect_compose
    validate_env
    check_required_vars
    auto_construct_vars
    wave4_logout_notice
    set_defaults
    setup_directories
    validate_deploy_assets
    build_and_start
    run_migrations
    health_check
}

main
