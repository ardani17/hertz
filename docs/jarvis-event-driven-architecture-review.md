# Review Jarvis — Event-Driven Architecture di Horizon

Tanggal review: 2026-05-23 19:21 WIB  
Reviewer: Jarvis  
Project: `/www/dk_project/horizon`

> Catatan: review ini mendokumentasikan sibling project `/www/dk_project/horizon`, bukan codebase Hertz aktif. Disimpan sebagai referensi arsitektur lintas project.

## Kesimpulan Singkat

Horizon **belum menerapkan event-driven architecture secara penuh**.

Yang ada sekarang adalah pola **semi event-driven / event-like**:

- Ada webhook dari Telegram sebagai event eksternal.
- Ada tabel `notification_events`, `hertz_notifications`, dan `activity_logs`.
- Ada beberapa proses async `fire-and-forget` untuk notification.
- Ada Redis, tetapi dipakai untuk typing status, bukan event bus/queue.

Namun, belum ada komponen inti EDA seperti:

- `EventBus`
- domain event dispatcher
- queue worker
- Redis Streams
- RabbitMQ / Kafka / NATS
- BullMQ
- outbox pattern yang benar-benar diproses worker

Jadi arsitektur saat ini masih dominan **service-to-service direct call**, bukan publish/subscribe.

---

## Bukti dari Codebase

### 1. Comment dibuat lalu service lain dipanggil langsung

File:

```text
shared/services/hertzCommentService.ts
```

Temuan:

```ts
void this.push.notifyHertzCommentCreated(...)
void this.inAppNotifications.notifyComment(...)
```

Artinya setelah komentar dibuat, service komentar langsung memanggil:

- `PushNotificationService`
- `HertzInAppNotificationService`

Ini asynchronous secara teknis karena memakai `void`, tetapi belum EDA penuh karena tidak ada event broker/event bus di tengah.

Pola saat ini:

```text
HertzCommentService
  -> create comment
  -> update stats
  -> log activity
  -> call PushNotificationService directly
  -> call HertzInAppNotificationService directly
```

Pola EDA yang ideal:

```text
HertzCommentService
  -> publish hertz.comment.created
  -> EventBus / Outbox / Queue
  -> Notification worker consumes event
  -> Push worker consumes event
  -> Analytics/log worker consumes event
```

---

### 2. Pulse, repost, quote juga panggil notification langsung

File:

```text
shared/services/hertzInteractionService.ts
```

Temuan:

```ts
void this.inAppNotifications.notifyPulse(...)
void this.inAppNotifications.notifyRepost(...)
void this.inAppNotifications.notifyQuote(...)
```

Ini menunjukkan coupling langsung antara interaction service dan notification service.

Dampaknya:

- Kalau nanti notification logic makin kompleks, service interaction ikut makin berat.
- Kalau mau tambah analytics, recommendation, atau fraud detection, logic harus ditambah di flow utama.
- Tidak ada satu jalur event standar untuk semua side effect.

---

### 3. DM message juga langsung trigger notification

File:

```text
shared/services/hertzDmService.ts
```

Temuan:

```ts
void this.push.notifyDmMessageCreated(...)
void this.inAppNotifications.notifyDm(...)
```

Ini mirip comment flow. Sudah ada side effect async, tetapi bukan publish event.

Event idealnya:

```text
dm.message.created
```

Lalu listener/worker menangani:

- push notification
- in-app notification
- unread counter
- analytics
- moderation/fraud jika nanti perlu

---

### 4. Ada tabel `notification_events`, tapi belum menjadi event outbox umum

File:

```text
db/migrations/011_create_mobile_notifications.sql
shared/repositories/notificationEventRepository.ts
```

Tabel:

```sql
CREATE TABLE IF NOT EXISTS notification_events (...)
```

Repository juga punya:

```ts
listRetryable(limit = 50)
```

Ini bagus karena sudah ada konsep event status:

- `pending`
- `sent`
- `failed`
- `skipped`

Namun cakupannya masih spesifik untuk **push notification delivery log**, bukan domain event outbox umum.

Belum terlihat worker yang rutin memproses `listRetryable()` sebagai background queue utama.

---

### 5. Ada in-app notification table

File:

```text
db/migrations/013_create_hertz_notifications.sql
shared/services/hertzInAppNotificationService.ts
```

Tabel:

```sql
CREATE TABLE IF NOT EXISTS hertz_notifications (...)
```

Ini adalah storage notification, bukan event broker.

Fungsinya lebih dekat ke:

```text
notification inbox / bell timeline
```

bukan:

```text
domain event stream
```

---

### 6. Redis ada, tapi bukan untuk event queue

File:

```text
docker-compose.yml
frontend/src/lib/redis.ts
```

Compose punya service Redis:

```yaml
redis:
  image: redis:7-alpine
```

Frontend memakai:

```text
REDIS_URL=redis://redis:6379
```

Namun pemakaian Redis saat ini untuk typing status:

```ts
setTypingStatus
clearTypingStatus
listTypingStatuses
```

Tidak ditemukan pemakaian Redis untuk:

- `XADD`
- `XREAD`
- pub/sub `.publish()` / `.subscribe()`
- BullMQ queue
- background worker event processing

---

## Search Negatif

Saya cek tanda-tanda EDA/broker umum dan tidak menemukan implementasi nyata untuk:

```text
EventBus
DomainEvent
outbox
BullMQ / bullmq
RabbitMQ / amqplib
Kafka / kafkajs
NATS
Redis Streams / xadd / xread
.publish()
.subscribe()
```

Hasilnya praktis kosong untuk source utama `shared`, `bot`, `frontend/src`, dan `db`.

---

## Status Arsitektur Saat Ini

### Yang sudah bagus

1. Side effect penting tidak selalu blocking request utama.
2. Push failure tidak menghentikan workflow utama.
3. Ada tabel `notification_events` untuk jejak pengiriman push.
4. Ada `hertz_notifications` untuk in-app notification.
5. Redis sudah tersedia di deployment, jadi fondasi infrastruktur ada.
6. Service layer cukup jelas, sehingga refactor ke event-driven masih masuk akal.

### Yang masih kurang

1. Domain event belum jadi konsep utama.
2. Service masih saling panggil langsung.
3. Belum ada queue/broker/worker.
4. Belum ada outbox pattern untuk reliability.
5. Retry mechanism belum terlihat sebagai background processing umum.
6. Event naming belum distandardkan di seluruh domain.

---

## Risiko dari Pola Sekarang

Pola sekarang masih aman untuk aplikasi kecil-menengah, tetapi akan terasa berat kalau traffic naik.

Risiko utama:

1. **Coupling naik**  
   Service utama tahu terlalu banyak tentang side effect.

2. **Sulit tambah consumer baru**  
   Misalnya mau tambah analytics saat comment dibuat, harus edit `HertzCommentService`.

3. **Reliability terbatas**  
   `void notify...` bagus agar tidak blocking, tetapi kalau proses mati setelah transaksi selesai dan sebelum notification terkirim, event bisa hilang.

4. **Observability kurang rapi**  
   Tidak ada satu event stream untuk melihat apa yang terjadi di sistem.

5. **Retry belum unified**  
   Ada status retryable di notification, tapi belum jadi mekanisme event processing umum.

---

## Rekomendasi Implementasi Bertahap

Saya sarankan jangan langsung Kafka/RabbitMQ. Untuk Horizon saat ini, paling masuk akal mulai dari **Postgres Outbox Pattern** karena Postgres sudah ada dan lebih sederhana.

### Phase 1 — Tambah domain event outbox

Buat tabel:

```sql
CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(120) NOT NULL,
  aggregate_type VARCHAR(80),
  aggregate_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_domain_events_status_created
  ON domain_events(status, created_at ASC);

CREATE INDEX idx_domain_events_type_created
  ON domain_events(event_type, created_at DESC);
```

### Phase 2 — Buat `DomainEventService`

Contoh interface:

```ts
export type DomainEventType =
  | 'hertz.post.created'
  | 'hertz.comment.created'
  | 'hertz.pulse.created'
  | 'hertz.repost.created'
  | 'hertz.quote.created'
  | 'dm.message.created';

export interface DomainEventPayload {
  [key: string]: unknown;
}

export class DomainEventService {
  async publish(input: {
    eventType: DomainEventType;
    aggregateType?: string;
    aggregateId?: string;
    payload: DomainEventPayload;
  }, client?: DbClient): Promise<void> {
    // insert into domain_events inside same DB transaction
  }
}
```

Penting: event harus dibuat **dalam transaksi yang sama** dengan perubahan data utama.

Contoh:

```text
create comment + insert domain event
```

harus atomic.

### Phase 3 — Buat worker

Worker membaca event pending:

```text
domain_events where status = pending order by created_at asc limit 50
```

Lalu dispatch ke handler:

```ts
handlers['hertz.comment.created'] = async (event) => {
  await createInAppNotification(event);
  await enqueuePushNotification(event);
};
```

### Phase 4 — Pindahkan side effect keluar dari service utama

Sebelum:

```ts
void this.push.notifyHertzCommentCreated(...)
void this.inAppNotifications.notifyComment(...)
```

Sesudah:

```ts
await this.events.publish({
  eventType: 'hertz.comment.created',
  aggregateType: 'comment',
  aggregateId: comment.id,
  payload: {
    postId: resolvedPostId,
    commentId: comment.id,
    actorUserId: user.id,
  },
}, client);
```

### Phase 5 — Baru pertimbangkan Redis/BullMQ

Jika traffic sudah tinggi atau butuh near real-time fanout, baru pertimbangkan:

- BullMQ di Redis
- Redis Streams
- RabbitMQ
- Kafka

Untuk sekarang, Postgres outbox cukup.

---

## Event yang Saya Rekomendasikan untuk Horizon

Minimal event awal:

```text
hertz.post.created
hertz.post.published
hertz.comment.created
hertz.pulse.created
hertz.repost.created
hertz.quote.created
dm.message.created
user.registered
credit.awarded
media.uploaded
```

Consumer awal:

```text
InAppNotificationConsumer
PushNotificationConsumer
ActivityLogConsumer
CreditConsumer
AnalyticsConsumer
ModerationConsumer
```

---

## Prioritas Paling Masuk Akal

Kalau mau implement sekarang, urutan paling aman:

1. Tambah `domain_events` table.
2. Buat repository/service untuk insert event.
3. Integrasikan hanya ke `hertz.comment.created` dulu.
4. Buat worker sederhana untuk notification.
5. Setelah stabil, pindahkan DM, pulse, repost, quote.
6. Setelah itu baru credit/activity log.

Jangan langsung refactor semua karena risiko regression cukup besar.

---

## Verdict Jarvis

**Status:** belum EDA penuh.  
**Level saat ini:** event-like asynchronous side effects.  
**Fondasi:** cukup bagus untuk di-upgrade.  
**Rekomendasi:** mulai dari Postgres outbox, bukan Kafka/RabbitMQ dulu.

Kalau target Horizon adalah platform komunitas trader yang makin ramai, EDA akan membantu terutama untuk notification, analytics, moderation, credit, dan audit log.
