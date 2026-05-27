# PRD 2 — Aplikasi Mobile Hertz (Expo) — End to End

Status: **Draft v1** · 27 Mei 2026
Owner: Mobile Engineering
Dependensi: [`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md) — wajib Epic A + B selesai sebelum integrasi
ADR: [`architecture-decisions.md`](./architecture-decisions.md)

> PRD ini mencakup **end-to-end**: setup repo, arsitektur app, fitur, build, beta, public release, operasional pasca-launch. Setiap epic punya acceptance criteria yang jelas.

---

## 1. Visi & Tujuan

### 1.1 Visi

Aplikasi mobile Hertz adalah **rumah utama trader Hertz di smartphone** — feed sosial real-time, DM aman, notifikasi instan, dan akses cepat ke analisa (Outlook). Pengalaman setara web saat ini, dengan ergonomi native (gesture, push, offline-friendly).

### 1.2 Tujuan (MVP)

1. **Penetrasi mobile**: minimal 60% MAU member Hertz install dan login ulang dari mobile dalam 8 minggu post-launch.
2. **Retensi 7-hari**: ≥ 45%.
3. **Crash-free sessions**: ≥ 99.5%.
4. **TTI (time-to-interactive)**: ≤ 2.5 s di mid-tier Android (Snapdragon 6xx kelas).
5. **App Store / Play Store rating**: ≥ 4.3 dalam 30 hari pertama publish.

### 1.3 Non-Tujuan

- **Tidak** menggantikan web (web tetap canonical untuk admin & long-form).
- **Tidak** include Tools (challenge tracker, dsb.) di MVP.
- **Tidak** integrasi non-Telegram OAuth (Google/Apple) di MVP.
- **Tidak** support tablet layout di MVP (works on tablet, tidak optimized).
- **Tidak** background sync; semua state dimuat saat user buka app.

---

## 2. Persona & User Stories

### 2.1 Persona

| Persona | Profile | Pain points |
|---------|---------|-------------|
| **Sena (29, scalper)** | Trading XAUUSD harian, post 2–3× sehari, butuh notif cepat | Web di mobile lambat, push lemah |
| **Adi (35, swing trader)** | Baca Outlook tiap pagi, kadang post review | Banyak scroll, ribet share screenshot ke DM |
| **Rina (24, baru member)** | Lurker, baca DM komunitas | Lupa login, sering re-auth |

### 2.2 User stories utama (P0)

- Sebagai member, saya bisa login dengan akun Telegram saya dalam < 30 detik.
- Sebagai member, saya bisa scroll feed Hertz dengan smooth (60fps).
- Sebagai member, saya bisa post text + multi-foto + market context (pair/SL/TP).
- Sebagai member, saya bisa membalas DM dengan foto dan teks.
- Sebagai member, saya menerima push notif saat ada komentar/DM baru, walaupun app ditutup.
- Sebagai member, saya bisa lihat profil saya dan profil member lain.
- Sebagai member, saya bisa cari post/member dari search bar global.
- Sebagai member, saya bisa baca Outlook (analisa) tanpa perlu pindah ke browser.

### 2.3 User stories P1

- Sebagai member, saya bisa bookmark post untuk dibaca nanti.
- Sebagai member, saya bisa repost (plain / quote).
- Sebagai member, saya bisa report post tidak pantas.
- Sebagai member, saya bisa lihat market rail (XAUUSD, EURUSD, dst.) di header feed.
- Sebagai member, saya bisa block member lain.
- Sebagai member, saya bisa logout dari device specific (kelola sesi).

---

## 3. Scope MVP

### 3.1 In Scope

| Modul | Detail |
|-------|--------|
| **Auth** | Telegram login (in-app browser handoff), session refresh otomatis, multi-device, kelola sesi |
| **Feed** | Untuk Anda + Trending, infinite scroll, pull-to-refresh, post detail modal |
| **Compose** | Text (4000 char), foto multi (max 4), market context optional |
| **Interaksi** | Pulse (like), comment + reply, bookmark, repost, report |
| **DM** | Inbox, conversation thread, send text + foto (max 4), typing indicator (read), block/unblock |
| **Notifikasi** | List in-app, summary badge, push notification (Expo Push) |
| **Profil** | Profil saya (view + edit: bio, location, hobbies, social, trading, avatar, cover), profil publik member lain |
| **Search** | Global (post + member) |
| **Outlook** | Reader read-only (list + detail) |
| **Gallery** | Grid view read-only |
| **Market rail** | Strip widget di top feed |
| **Settings** | Theme (auto/dark/light), notification preferences, kelola sesi, logout, version info |

### 3.2 Out of Scope MVP

Lihat ADR-012. Roadmap v2 di §15.

---

## 4. Prinsip Arsitektur App

### 4.1 Stack utama

| Layer | Pilihan | Justifikasi |
|-------|---------|-------------|
| Runtime | **Expo SDK 51+** (managed) | Cepat onboarding, OTA update, less native config |
| Bahasa | **TypeScript** | Type sharing dengan backend |
| Navigasi | **Expo Router** (file-based) | Konsisten Next.js pattern, type-safe routes |
| State client | **Zustand** (per slice) | Ringan, no boilerplate vs Redux |
| Server state | **TanStack Query** (`@tanstack/react-query`) | Cache, refetch, mutation, infinite scroll built-in |
| API client | **ky** atau **fetch** wrapper custom | Auth header, retry, JSON envelope handling |
| Form | **react-hook-form** + **zod** | Type-safe, share zod schema dengan backend bila perlu |
| Storage aman | **expo-secure-store** | Bearer token, refresh metadata |
| Storage non-sensitif | **expo-mmkv** (atau `expo-sqlite-kv-storage`) | Cache feed, profile, last seen |
| Image | **expo-image** | Caching built-in, fast |
| Notification | **expo-notifications** | Push handling + local notif |
| Deep link | **expo-linking** | Universal/App Link parsing |
| Auth browser | **expo-web-browser** | In-app browser handoff |
| Updates | **expo-updates** + **EAS Update** | OTA bundle, channel separation |
| Sentry | **@sentry/react-native** | Crash reporting + perf |
| Analytics | **expo-firebase-analytics** atau **PostHog RN** | Engagement metrics |
| Linting | **ESLint** + **Prettier** (sama config repo) | Konsistensi |
| Testing | **Jest** + **React Native Testing Library** + **Detox** (E2E P1) | Standard |
| Build | **EAS Build** | iOS + Android tanpa Mac/Xcode lokal |
| Submit | **EAS Submit** | Otomatis ke stores |

### 4.2 Folder structure

```
apps/mobile/
├── app.json                      # Expo config
├── eas.json                      # EAS build/submit profiles
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── app/                          # Expo Router (screens)
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Splash / route guard
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (app)/                    # Tab + stack post-auth
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── feed/
│   │   │   ├── index.tsx
│   │   │   └── [shortId].tsx     # Post detail
│   │   ├── outlook/
│   │   │   ├── index.tsx
│   │   │   └── [slug].tsx
│   │   ├── messages/
│   │   │   ├── index.tsx         # Inbox
│   │   │   └── [conversationId].tsx
│   │   ├── notifications/
│   │   │   └── index.tsx
│   │   ├── profile/
│   │   │   ├── me.tsx
│   │   │   └── [username].tsx
│   │   ├── search.tsx
│   │   ├── compose.tsx           # Modal screen
│   │   └── settings/
│   │       ├── index.tsx
│   │       └── sessions.tsx
│   └── auth/callback.tsx         # Deep link callback
├── src/
│   ├── api/
│   │   ├── client.ts             # Fetch wrapper + bearer + retry
│   │   ├── endpoints/
│   │   │   ├── auth.ts
│   │   │   ├── feed.ts
│   │   │   ├── dm.ts
│   │   │   ├── notifications.ts
│   │   │   ├── profile.ts
│   │   │   ├── search.ts
│   │   │   ├── media.ts
│   │   │   └── outlook.ts
│   │   ├── queries/              # TanStack Query hooks
│   │   │   ├── useFeed.ts
│   │   │   ├── usePostDetail.ts
│   │   │   ├── useDmInbox.ts
│   │   │   ├── useDmThread.ts
│   │   │   └── ...
│   │   ├── mutations/
│   │   │   ├── useCreatePost.ts
│   │   │   ├── useSendMessage.ts
│   │   │   └── ...
│   │   └── errors.ts             # ApiError class
│   ├── auth/
│   │   ├── store.ts              # Zustand auth store
│   │   ├── secureStore.ts        # Token persistence
│   │   └── handoff.ts            # Telegram handoff orchestrator
│   ├── components/
│   │   ├── common/
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── IconButton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── ErrorView.tsx
│   │   │   └── PullToRefresh.tsx
│   │   ├── feed/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostMedia.tsx
│   │   │   ├── PostActions.tsx
│   │   │   ├── MarketContextChip.tsx
│   │   │   └── ComposeSheet.tsx
│   │   ├── dm/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ConversationList.tsx
│   │   │   ├── TypingDots.tsx
│   │   │   └── AttachmentPicker.tsx
│   │   ├── notifications/
│   │   │   └── NotificationItem.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── ProfileEditor.tsx
│   │   └── market/
│   │       └── MarketRail.tsx
│   ├── notifications/
│   │   ├── pushSetup.ts          # Register, handle deep link
│   │   ├── handlers.ts           # Foreground/background handlers
│   │   └── badge.ts              # iOS badge mgmt
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── ThemeProvider.tsx
│   ├── i18n/                     # Indonesia default; en placeholder
│   │   ├── id.json
│   │   ├── en.json
│   │   └── index.ts
│   ├── lib/
│   │   ├── format.ts             # Date, number, currency
│   │   ├── analytics.ts
│   │   ├── sentry.ts
│   │   └── env.ts
│   └── types/                    # Local-only types
└── assets/
    ├── icons/
    ├── splash.png
    ├── icon.png                  # 1024x1024
    └── adaptive-icon.png         # Android
```

### 4.3 Layered architecture

```
Screen (app/) ──> Hook (queries/, mutations/) ──> ApiClient ──> Backend
              ──> Zustand store (auth, ui state)
              ──> Component (components/)
```

Aturan:
- Screen TIDAK panggil API langsung; selalu via hook.
- Hook TIDAK simpan UI state; cuma server state + cache.
- Komponen `components/` PURE (props-driven), TIDAK akses store langsung kecuali designated.
- Theming via `useTheme()` hook; jangan hardcode color.

### 4.4 Data flow auth

```
Splash (index.tsx)
  → cek SecureStore token
    → ada: validate via GET /me
      → valid: navigate (app)/feed
      → invalid (401): clear token, navigate (auth)/login
    → tidak ada: navigate (auth)/login

Login screen
  → tap "Login dengan Telegram"
    → call POST /auth/handoff/init → terima { nonce, handoffUrl }
    → buka WebBrowser.openAuthSessionAsync(handoffUrl, "hertz://auth/callback")
    → user authorize di Telegram widget di web bridge
    → bridge page redirect hertz://auth/callback?token=<bearer>&expiresAt=...
    → deep link tertangkap by app/auth/callback.tsx
      → simpan token di SecureStore
      → store ke Zustand
      → navigate (app)/feed
```

### 4.5 Performance budget

| Metric | Target |
|--------|--------|
| App launch cold start (Pixel 5) | < 2.0 s |
| TTI feed (network OK) | < 2.5 s |
| Image decode (1080p) | < 200 ms (via expo-image) |
| Scroll FPS feed | 60 fps avg |
| Memory peak | < 250 MB |
| App size (Android APK) | < 50 MB |
| Cold network call | timeout 15 s, retry 1× |

---

## 5. Epic Plan

| Epic | Title | Output |
|------|-------|--------|
| **A** | Foundation & Setup | Repo, Expo init, EAS, CI/CD, ENV |
| **B** | Design System & Navigation | Theme, components, navigation skeleton |
| **C** | Auth & Onboarding | Telegram handoff, splash, login screen, deep link |
| **D** | Feed & Compose | Feed list, post detail, compose, media picker |
| **E** | DM | Inbox, thread, send, typing, block |
| **F** | Notifications | List, summary badge, push register, foreground/background handlers |
| **G** | Profile & Search | Me + public profile, search global |
| **H** | Outlook & Gallery & Market | Read-only modules |
| **I** | Settings & Sessions | Theme toggle, notification prefs, kelola sesi |
| **J** | QA, Beta, Submit | Detox E2E, TestFlight, Play Internal, App Store + Play Store |
| **K** | Operations & Iteration | Analytics, crash dashboard, OTA, release cadence |

Dependensi:
- A → B → C wajib sequence.
- D–H bisa paralel setelah C live (selama backend ready).
- I bisa paralel C–H.
- J setelah semua D–I.
- K mulai bersamaan J (analytics live di beta).

---

## 6. Epic A — Foundation & Setup

### A1 — Inisialisasi Expo project

**Tasks:**
- [ ] `npx create-expo-app@latest apps/mobile --template default` (TS).
- [ ] Tambah `apps/mobile` ke workspace root `package.json` (`"workspaces": ["frontend", "bot", "apps/mobile"]`).
- [ ] Set `tsconfig.json` extends `tsconfig.base.json`; tambah path alias `@shared/*` → `../../shared/*`.
- [ ] Konfigurasi `app.json`:
  - `name: "Hertz"`, `slug: "hertz-mobile"`
  - `scheme: "hertz"`
  - `ios.bundleIdentifier: "com.hertz.app"`
  - `ios.associatedDomains: ["applinks:hertz.cloudnexify.com"]`
  - `android.package: "com.hertz.app"`
  - `android.intentFilters` untuk `https://hertz.cloudnexify.com/auth/callback`
  - `orientation: "portrait"`
  - `userInterfaceStyle: "automatic"` (theme system)
  - `runtimeVersion: { policy: "appVersion" }`
  - `updates.url: "https://u.expo.dev/<projectId>"`
- [ ] Konfigurasi `eas.json` dengan profile `development`, `preview`, `production`.

### A2 — Dependencies install

```bash
cd apps/mobile

# Core
npm install expo-router expo-linking expo-constants expo-status-bar
npm install expo-secure-store expo-web-browser expo-image expo-image-picker
npm install expo-notifications expo-device expo-application expo-updates
npm install expo-haptics expo-clipboard

# State + data
npm install zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers

# UI
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-safe-area-context react-native-screens

# Network
npm install ky

# Observability
npm install @sentry/react-native
npm install posthog-react-native

# Storage
npm install react-native-mmkv

# Dev
npm install --save-dev @testing-library/react-native jest jest-expo
npm install --save-dev detox
```

### A3 — Expo Router setup

- [ ] Wire `expo-router` di `package.json` main: `"main": "expo-router/entry"`.
- [ ] Hapus `App.tsx` default; gunakan `app/_layout.tsx` sebagai entry.
- [ ] Tambah type generation: `npx expo-router typegen` di prebuild.

### A4 — Environment management

File `src/lib/env.ts`:
```ts
import Constants from 'expo-constants';

export const env = {
  API_BASE_URL: Constants.expoConfig?.extra?.apiBaseUrl ?? 'https://hertz.cloudnexify.com',
  SENTRY_DSN: Constants.expoConfig?.extra?.sentryDsn ?? '',
  POSTHOG_KEY: Constants.expoConfig?.extra?.posthogKey ?? '',
  APP_ENV: (Constants.expoConfig?.extra?.appEnv ?? 'production') as 'development' | 'preview' | 'production',
  DEEP_LINK_SCHEME: 'hertz',
};
```

Di `eas.json` per profile, set `env.EXPO_PUBLIC_*` atau extra fields via `app.config.ts` dinamis.

### A5 — CI

- [ ] GitHub Actions workflow `mobile-ci.yml`:
  - On PR yang touch `apps/mobile/**` atau `shared/**`:
    - `npm ci`
    - `npm run lint --workspace=apps/mobile`
    - `npm run test --workspace=apps/mobile`
    - `npx tsc -p apps/mobile --noEmit`
- [ ] Workflow `mobile-eas-preview.yml`:
  - On push branch `mobile/preview`: `eas build --profile preview --platform all --non-interactive`.

### A6 — EAS account & credentials

- [ ] `eas login` (akun org).
- [ ] `eas init` di `apps/mobile/`.
- [ ] iOS: setup Apple Developer Program ($99/yr), generate distribution cert + provisioning profile via `eas credentials`.
- [ ] Android: generate upload keystore via EAS managed.
- [ ] Google Play Console setup ($25 one-time), package name match `com.hertz.app`.

### A7 — App icon & splash

- [ ] Sementara reuse logo Horizon (ADR Open Q6). Generate icon set via `expo-icon` atau Figma export.
- [ ] `assets/icon.png` 1024×1024, `assets/adaptive-icon.png` (foreground 1024×1024 transparent).
- [ ] `splash.png` 1284×2778 (iPhone 14 Pro Max), `splash.config.json` resizeMode `contain`, backgroundColor `#0a0a0f`.

### Acceptance Criteria Epic A

- [ ] `npx expo start --tunnel` jalan, app load di Expo Go (development).
- [ ] `eas build --platform ios --profile preview` selesai dengan IPA terdownload.
- [ ] `eas build --platform android --profile preview` selesai dengan APK.
- [ ] CI hijau di PR contoh.

---

## 7. Epic B — Design System & Navigation

### B1 — Theme

Tokens di `src/theme/`:

**`colors.ts`** (mirror token web `var(--hertz-*)`):
```ts
export const lightColors = {
  bgBase: '#f7faf8',
  surface: 'rgba(255,255,255,0.94)',
  text: '#0a0a0f',
  textMuted: '#5b6b62',
  textOnAccent: '#f7faf8',
  accent: '#13d27b',
  border: 'rgba(10,10,15,0.08)',
  // ...
};
export const darkColors = {
  bgBase: '#0a0a0f',
  surface: 'rgba(15,19,18,0.78)',
  text: '#f3fff8',
  textMuted: '#91a79a',
  textOnAccent: '#031008',
  accent: '#13d27b',
  border: 'rgba(255,255,255,0.08)',
  // ...
};
```

**`spacing.ts`**:
```ts
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
```

**`typography.ts`**:
```ts
export const typography = {
  fontFamily: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_700Bold' },
  size: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
  lineHeight: { tight: 1.15, normal: 1.4, relaxed: 1.6 },
};
```

`ThemeProvider.tsx` deteksi `useColorScheme()` + manual override (Settings).

### B2 — Komponen common

| Komponen | Variants | Notes |
|----------|----------|-------|
| `Button` | `primary \| secondary \| ghost \| destructive`, sizes `sm/md/lg`, `loading`, `disabled` | Reanimated press scale |
| `IconButton` | `default \| ghost`, `badge?` | Hit-slop 44pt min |
| `Avatar` | `xs/sm/md/lg/xl`, online indicator | Fallback initials |
| `Skeleton` | `card \| line \| circle` | Shimmer animation |
| `EmptyState` | `icon, title, description, action?` | |
| `ErrorView` | `title, message, retry?` | |
| `PullToRefresh` | Wrapper around `RefreshControl` | |
| `BottomSheet` | Menggunakan `@gorhom/bottom-sheet` | Snap points |
| `Toast` | Top sliding, auto dismiss | Singleton |

Storybook (P1, optional): `npm i @storybook/react-native` untuk preview.

### B3 — Navigation skeleton

`app/(app)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Home, Compass, Bell, MessageCircle, User } from 'lucide-react-native';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { /* themed */ } }}>
      <Tabs.Screen name="feed" options={{ tabBarIcon: Home }} />
      <Tabs.Screen name="search" options={{ tabBarIcon: Compass }} />
      <Tabs.Screen name="notifications" options={{ tabBarIcon: Bell }} />
      <Tabs.Screen name="messages" options={{ tabBarIcon: MessageCircle }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: User }} />
    </Tabs>
  );
}
```

Tab bar custom: pill indicator, badge unread, hidden saat keyboard open.

Floating action button (compose) overlay di feed tab.

### Acceptance Criteria Epic B

- [ ] Theme switch dark/light/auto bekerja.
- [ ] Semua komponen common rendered tanpa error di Storybook atau test screen.
- [ ] Tab navigation 5 tab muncul; tap pindah screen.

---

## 8. Epic C — Auth & Onboarding

### C1 — Splash + route guard

`app/index.tsx`:
- Tampilkan splash logo + spinner ≤ 500 ms.
- Cek `SecureStore.getItemAsync('hertz_token')`.
- Bila ada → `GET /api/mobile/v1/me`:
  - 200 → simpan user ke Zustand, `router.replace('/(app)/feed')`.
  - 401 → clear token, `router.replace('/(auth)/login')`.
- Bila tidak ada → `router.replace('/(auth)/login')`.

### C2 — Login screen

`app/(auth)/login.tsx`:
- Logo Hertz besar + tagline.
- 1 tombol primary: **"Login dengan Telegram"**.
- Subtext: "Hanya member grup Telegram Hertz yang bisa masuk."
- Link kecil "Belum jadi member? Bergabung" → `Linking.openURL("https://t.me/hertz_<group>")`.

Tap tombol:
```ts
async function handleTelegramLogin() {
  setLoading(true);
  try {
    const { nonce, handoffUrl } = await api.auth.handoffInit({
      deviceId: await Application.getAndroidId() ?? await Application.getIosIdForVendorAsync(),
      platform: Platform.OS,
      appVersion: Application.nativeApplicationVersion,
    });
    const result = await WebBrowser.openAuthSessionAsync(handoffUrl, 'hertz://auth/callback');
    if (result.type === 'success') {
      // deep link handler will pick it up
    } else if (result.type === 'cancel') {
      showToast('Login dibatalkan');
    }
  } catch (err) {
    showToast(formatError(err));
  } finally {
    setLoading(false);
  }
}
```

### C3 — Deep link callback

`app/auth/callback.tsx` (route handler):

```ts
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';

export default function AuthCallback() {
  const { token, expiresAt } = useLocalSearchParams<{ token: string; expiresAt: string }>();
  useEffect(() => {
    if (!token) {
      router.replace('/(auth)/login');
      return;
    }
    (async () => {
      await secureStore.setToken(token, expiresAt);
      await authStore.refresh(); // calls /me
      router.replace('/(app)/feed');
    })();
  }, [token]);
  return null;
}
```

### C4 — Session refresh

Hook `useSessionRefresh()` di `_layout.tsx`:
- Saat app foreground (`AppState`), bila `expiresAt` < 1 jam lagi → call `POST /auth/refresh`.
- Bila 401 di mana saja → trigger global logout (clear secure store, navigate login).

### C5 — Logout

Setting screen → tombol logout:
- Confirm dialog.
- `POST /logout` (best-effort).
- Clear SecureStore + Zustand.
- Unregister push token (best-effort).
- Navigate login.

### Acceptance Criteria Epic C

- [ ] Login Telegram berhasil di iOS + Android, token tersimpan, navigate ke feed.
- [ ] Re-open app dengan token valid → langsung feed, tanpa re-login.
- [ ] Re-open dengan token expired → auto logout ke login.
- [ ] Logout berhasil clear semua state.

---

## 9. Epic D — Feed & Compose

### D1 — Feed list

Screen `app/(app)/feed/index.tsx`:
- Top: Market rail (Epic H) — horizontal scroll chips dengan pair + change %.
- Sort tabs: "Untuk Anda" | "Trending".
- `FlashList` (atau `FlatList` dengan `getItemLayout`) dengan `PostCard` items.
- Infinite scroll: TanStack `useInfiniteQuery` → `GET /hertz/posts?cursor=...`.
- Pull-to-refresh.
- FAB compose di bottom-right (above tab bar).

`PostCard.tsx`:
- Header: avatar, displayName, @username, time ago, ... menu.
- Content: text (collapsed > 6 lines, expand button).
- Media grid: 1/2/3/4 layout (Instagram-style).
- Market context chip (jika ada): pair + side + entry → tap expand TP/SL.
- Action row: pulse (heart), comment, repost, bookmark, share.
- Counts (animated dengan Reanimated layout).

### D2 — Post detail

`app/(app)/feed/[shortId].tsx`:
- Re-render post card full + comments thread.
- Comment composer di bottom (sticky).
- Reply ke comment: indent + collapse threads (max depth 2).
- Saat dari deep link / push → fetch + auto-scroll ke target comment bila ada `?commentId=`.

### D3 — Compose

`app/(app)/compose.tsx` (modal screen, presentation `modal`):
- Header: cancel ↔ post button (disabled bila empty).
- Avatar + nama.
- TextInput multi-line autoexpand, char counter.
- Toolbar bottom: foto (max 4), market context toggle.
- Foto picker: `expo-image-picker.launchImageLibraryAsync({ mediaTypes: 'Images', selectionLimit: 4, allowsEditing: false })`.
- Compress: `expo-image-manipulator` resize max 1920px, quality 0.8 → upload via `POST /media/upload` (purpose `post`).
- Submit: `POST /hertz/posts` dengan `mediaIds`.
- Optimistic update: insert post at top feed via TanStack mutation `onMutate`.
- Sukses: navigate back + toast "Post berhasil dipublikasikan".
- Error: tetap di screen, toast error.

### D4 — Interaksi

Pulse:
- Optimistic toggle (+1 count, fill heart).
- Call `POST /posts/:shortId/like`.
- Rollback bila error.

Bookmark, repost (plain), report: serupa pulse pattern.

### D5 — Quote repost (P1)

Bottom sheet dari tombol repost → "Plain repost" | "Quote (tambah komentar)" → buka compose dengan post asli ter-embed (preview card).

### Acceptance Criteria Epic D

- [ ] Feed scroll 100+ post tanpa drop frame.
- [ ] Compose foto + market context → post live di feed real-time (via refetch).
- [ ] Pulse toggle responsif < 100ms perceived.
- [ ] Post detail dari push notification membuka post yang benar.

---

## 10. Epic E — Direct Messages

### E1 — Inbox

`app/(app)/messages/index.tsx`:
- List conversation: avatar partner, displayName, preview last message, time, unread badge.
- Empty state: "Belum ada percakapan. Cari member untuk memulai DM."
- Pull-to-refresh + polling 10s (jeda saat background).
- Search bar di top: navigate ke `/(app)/search?initial=dm` → pilih user → start conversation.

### E2 — Conversation thread

`app/(app)/messages/[conversationId].tsx`:
- Inverted `FlashList` (newest at bottom).
- `MessageBubble`: text + attachments grid, time, read indicator (✓✓).
- Composer di bottom:
  - TextInput autoexpand.
  - Attachment button: foto picker (max 4, sesuai DM limit).
  - Send button.
- Typing indicator: 3 dots animasi bila `typingUserIds.length > 0`.
- Pull-down: load older messages (`hasMoreBefore`).

Polling strategy:
- Foreground active: fetch `?after=lastMessageId` setiap 5s.
- Background: stop polling.
- Push notification `dm.message.created` saat foreground: trigger immediate refetch.

User typing:
- TextInput `onChangeText` debounced 1s → `POST /typing`.
- Stop saat blur atau 5s no input.
- GET typing setiap 4s saat foreground.

Read receipts:
- Saat conversation focused, mark messages sebagai read via API (per message viewport detection).
- Sederhanakan MVP: mark seluruh thread as read saat first render.

### E3 — Actions

Long-press bubble:
- Bila pesan sendiri: Hapus.
- Bila pesan orang lain: Report, Block sender.

Header menu (...):
- Lihat profil partner.
- Block.
- Archive conversation.

### E4 — Empty/blocked state

- Bila partner block kita: composer disabled + banner "Kamu tidak bisa mengirim pesan kepada user ini."
- Bila kita block partner: composer disabled + tombol "Unblock untuk mengirim pesan."

### Acceptance Criteria Epic E

- [ ] Send text + foto sampai di partner < 6 detik (5s poll cycle).
- [ ] Typing indicator muncul di partner saat kita ketik.
- [ ] Pull-up load 50 pesan lama smooth.
- [ ] Block menyembunyikan composer + banner muncul.

---

## 11. Epic F — Notifications

### F1 — Setup push registration

File `src/notifications/pushSetup.ts`:
- Saat user login berhasil:
  1. Request permission (`Notifications.requestPermissionsAsync()`).
  2. Bila granted: get Expo Push Token (`Notifications.getExpoPushTokenAsync({ projectId })`).
  3. `POST /notifications/register` dengan `platform: 'expo'`, token, deviceId, appVersion.
- Saat logout: `POST /notifications/unregister`.

### F2 — Foreground handler

```ts
Notifications.setNotificationHandler({
  handleNotification: async (notif) => {
    // Saat user di conversation yang sama → suppress
    const data = notif.request.content.data as { type?: string; conversationId?: string };
    if (currentRoute === `/messages/${data.conversationId}`) {
      return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: true };
    }
    return { shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true };
  },
});
```

### F3 — Background / notification tap

`Notifications.addNotificationResponseReceivedListener((response) => {
  const { type, postShortId, conversationId } = response.notification.request.content.data;
  if (type === 'dm') router.push(`/messages/${conversationId}`);
  else if (type === 'comment' || type === 'pulse') router.push(`/feed/${postShortId}`);
  else if (type === 'mention') router.push(`/feed/${postShortId}`);
});`

### F4 — In-app notifications screen

`app/(app)/notifications/index.tsx`:
- List `NotificationItem` (actor avatar + action text + time).
- Tap item → navigate to target (`postShortId` → feed detail, `conversationId` → message thread).
- Pull-to-refresh.
- Mark all as read button di header.
- Saat screen focused: auto mark visible items as read (debounce 1s).

### F5 — Badge

iOS badge: maintain via `Notifications.setBadgeCountAsync(unreadCount + unreadDmCount)` saat:
- Login.
- App foreground → fetch `/notifications/summary`.
- Notif received foreground.
- Mark as read.

Android: tab bar badge component.

### F6 — Settings push prefs (Epic I)

User bisa toggle per kategori:
- Comments
- Pulses
- DM
- Mentions
- Reposts

Implementation: simpan preference di backend (P2) atau local-only MVP. **MVP: local-only**, store di MMKV, drop notif di handler.

### Acceptance Criteria Epic F

- [ ] Push diterima di Android + iOS (TestFlight + Play internal).
- [ ] Tap notification dengan app closed → buka app + navigate ke screen target.
- [ ] Notification foreground saat user di screen target → silent (no popup).
- [ ] Badge iOS sinkron dengan summary.

---

## 12. Epic G — Profile & Search

### G1 — Profil saya

`app/(app)/profile/me.tsx`:
- Header: cover image, avatar, displayName, @username, bio, location.
- Stats row: posts, joined date.
- Action: Edit profile (modal).
- Tabs: Posts | Bookmarks | Replies.
- Logout di settings (tab terpisah).

### G2 — Edit profile

`ProfileEditor.tsx` (modal):
- Form fields: displayName, bio (200 char), location, hobbies (chip input), socialLinks (twitter/x, instagram, youtube), trading (style, instruments, since).
- Avatar picker: tap avatar → camera/gallery → crop → upload `purpose: profile_avatar`.
- Cover picker: serupa.
- Save → `PATCH /profile/me`.

### G3 — Profil publik

`app/(app)/profile/[username].tsx`:
- Header identik me tapi tanpa edit.
- Action: Message (start DM), Block (menu).
- Tab: Posts.
- Bila blocked → tampilkan empty state "User memblokir kamu."

### G4 — Search

`app/(app)/search.tsx`:
- Search bar persistent di top.
- Tab: Posts | Members.
- Recent searches (lokal MMKV).
- Suggestions saat ketik (debounce 300ms): `GET /hertz/search?q=&type=`.
- Hasil: list dengan paginated infinite scroll.
- Tap result → navigate detail.

### Acceptance Criteria Epic G

- [ ] Edit profile + upload avatar berhasil persist setelah relog.
- [ ] Profil publik dari mention/link bekerja.
- [ ] Search return hasil < 1 detik (network OK).

---

## 13. Epic H — Outlook, Gallery, Market Rail

### H1 — Outlook list

`app/(app)/outlook/index.tsx`:
- List card OutlookCard: cover image, title, author, published time, tag.
- Search bar.
- Infinite scroll.

### H2 — Outlook detail

`app/(app)/outlook/[slug].tsx`:
- Hero image.
- Title + meta.
- Markdown / rich content render (use `react-native-render-html` atau MDX-light).
- Bottom action: share (native share sheet).

### H3 — Gallery

`app/(app)/gallery.tsx` (di profile tab atau standalone):
- Grid 3 kolom.
- Tap → full screen viewer dengan pinch zoom (`react-native-image-zoom-viewer`).

### H4 — Market rail

`components/market/MarketRail.tsx`:
- Horizontal scroll chips: pair, last, change% (color coded).
- Fetch `/market/rail` cache 60s.
- Skeleton saat loading.

### Acceptance Criteria Epic H

- [ ] Outlook list & detail render konten dengan benar (image, paragraph, headings).
- [ ] Gallery zoom smooth.
- [ ] Market rail update saat pull-to-refresh feed.

---

## 14. Epic I — Settings & Sessions

### I1 — Settings screen

`app/(app)/settings/index.tsx`:
- Theme: Auto / Dark / Light radio.
- Notification preferences (toggles per kategori).
- Bahasa: Indonesia / English (placeholder MVP).
- Kelola sesi → navigate I2.
- About: version, build number, link ke Terms & Privacy (web URL).
- Logout button (destructive).

### I2 — Kelola sesi

`app/(app)/settings/sessions.tsx`:
- List `GET /me/sessions`.
- Item: deviceId/platform/appVersion + lastUsedAt + "Saat ini" badge.
- Swipe atau tombol Revoke → `DELETE /me/sessions/:id` (kecuali current).
- Tombol "Logout dari semua device" → loop revoke + logout self.

### I3 — Privacy & legal

- Bottom sheet: link ke Terms (web), Privacy Policy (web).
- Versi & build di footer.

### Acceptance Criteria Epic I

- [ ] Theme switch instant tanpa restart.
- [ ] Logout from other device terdeteksi di device tersebut saat next API call (401 → auto logout).

---

## 15. Epic J — QA, Beta, Submit

### J1 — Test plan

**Unit tests:** ≥ 70% statement coverage utility & hooks.

**Component tests:** smoke render semua screen (PostCard, MessageBubble, etc.).

**E2E (Detox):**
- Login flow happy path (mock Telegram via test token).
- Compose + lihat post di feed.
- Send DM ke test conversation.
- Tap notification → navigate.

**Manual QA matrix:**
- Devices iOS: iPhone SE 2020, iPhone 12, iPhone 14 Pro Max.
- Devices Android: Pixel 5 (Android 13), Samsung A52 (Android 12), Xiaomi mid (Android 11).
- Network: full WiFi, slow 4G (throttle test), offline (graceful errors).
- Locale: id-ID default.

### J2 — Beta internal (Week -2)

- EAS Build profile `preview`.
- Distribusi:
  - iOS: TestFlight Internal Testers (tim eng + product, ~10 user).
  - Android: APK direct download via internal link (atau Play Internal track).
- Periode 1 minggu.
- Feedback channel: Telegram grup internal Hertz Dev.
- Crash dashboard: Sentry.
- Iterate bugs P0/P1.

### J3 — Beta closed (Week -1)

- TestFlight Public link untuk 20–50 user pilihan.
- Play Console Closed Testing Track.
- Periode 1 minggu minimal.
- Target: zero P0 bugs, ≤ 3 P1, ≥ 4.0 user feedback score (informal).

### J4 — Store submission

**iOS — App Store Connect**

Checklist:
- [ ] Bundle ID `com.hertz.app` registered.
- [ ] App Store Connect listing draft:
  - Name: **Hertz**
  - Subtitle: "Komunitas Trader Indonesia"
  - Category: Finance (primary), Social Networking (secondary)
  - Age rating: 12+ (mild profanity dari user content)
  - Screenshots: 6.5", 6.7", 5.5" sets (5 minimum per size)
  - App preview video (optional, P2)
  - Description (Indonesia + English)
  - Keywords (trader, trading, komunitas, hertz, signal, analisa, xauusd, forex)
  - Support URL, Privacy Policy URL, Marketing URL
- [ ] App Privacy disclosure: account info (Telegram ID), user content (posts/DM), identifiers.
- [ ] Build via `eas build --profile production --platform ios`.
- [ ] Submit via `eas submit --profile production --platform ios`.
- [ ] Submit for review.
- [ ] Respond reviewer notes (umumnya: demo account, login mechanism explanation).

**Android — Google Play Console**

Checklist:
- [ ] Package `com.hertz.app` set.
- [ ] Store listing:
  - Title: **Hertz**
  - Short description (80 char)
  - Full description (4000 char)
  - Graphic assets: icon, feature graphic 1024×500, screenshots phone (8 max), tablet (optional)
- [ ] Content rating questionnaire (IARC) → expected Teen.
- [ ] Data safety form: account, app activity, messages, photos collected.
- [ ] Build `aab` via `eas build --platform android --profile production`.
- [ ] Submit `eas submit --platform android --profile production`.
- [ ] Production rollout 10% → 50% → 100% over 1 minggu.

### J5 — Release notes template

```
Versi 1.0.0 — Rilis perdana
- Login Telegram aman
- Feed sosial Hertz dengan compose foto + market context
- Direct messages
- Notifikasi push real-time
- Profil & search global
- Mode gelap & terang
```

### Acceptance Criteria Epic J

- [ ] App diterima App Store (TestFlight + production review pass).
- [ ] App live di Play Store.
- [ ] Zero P0 bug di production minggu pertama.
- [ ] Beta feedback score rata-rata ≥ 4.0.

---

## 16. Epic K — Operations & Iteration

### K1 — Monitoring

| Tool | Purpose |
|------|---------|
| **Sentry** | Crash + JS error + perf trace |
| **PostHog** | User events (login, post create, DM sent, notification tap) |
| **Expo dashboard** | OTA update success rate |
| **App Store Connect / Play Console** | Crash native, vital metrics |

KPI dashboard:
- DAU / MAU
- Retention D1/D7/D30
- Notification open rate
- Compose conversion (FAB tap → post submit)
- DM messages/day
- Crash-free sessions
- p95 API latency (dari client perspective)

### K2 — Release cadence

- **OTA update (EAS Update)** untuk JS-only fix: instant deploy ke `production` channel; user dapet update saat next app open.
- **Native build**: 2 minggu sekali (atau saat butuh native lib).
- **Hotfix**: OTA ASAP; bila menyangkut native → emergency build.

### K3 — Feedback loop

- In-app feedback: tombol di Settings → `mailto:feedback@hertz.cloudnexify.com` atau form.
- Crash alert → on-call eng triage dalam 24 jam.
- Bi-weekly review metrics + iterate.

### K4 — Runbook ops

`docs/mobile/runbook.md`:
- Cara push OTA update.
- Cara rollback OTA update.
- Cara investigate crash di Sentry.
- Cara reproduce push notif issue.
- Cara revoke session user (admin SQL).

### Acceptance Criteria Epic K

- [ ] Sentry receive crash dari test build.
- [ ] PostHog event muncul saat user login (test).
- [ ] OTA update test berhasil deliver ke device beta.

---

## 17. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| App Store review rejection (Telegram dependency) | Medium | High | Provide demo Telegram account; explain in review notes |
| Play Store data safety form misalign | Medium | Medium | Audit form sebelum submit; align dengan privacy policy |
| Expo Push delivery delay > 30s | Low | Medium | Adapter bisa switch ke FCM v1 |
| Deep link tidak trigger di iOS 17+ | Low | High | Verify Associated Domains setup + asasocialcheck |
| Compose foto upload timeout di koneksi lemah | Medium | Medium | Retry 1× + progress UI + cancel button |
| User confused dengan in-app browser handoff | Medium | Medium | Onboarding screen + tooltip; A/B test alt flow |
| FlashList memory leak feed panjang | Low | Medium | `estimatedItemSize` tepat, recycler config |
| OTA bundle terlalu besar (slow update) | Low | Low | Code splitting di Expo Router (auto) |
| Token bocor lewat log | Low | High | Sentry beforeSend scrub `Authorization` header |

---

## 18. Acceptance Criteria — MVP

Definition of Done untuk MVP launch:

- [ ] Semua Epic A–I selesai sesuai criteria masing-masing.
- [ ] Backend (PRD 1) P0 + P1 endpoint live.
- [ ] Beta closed 1 minggu, ≥ 20 tester aktif, ≥ 4.0 informal rating, zero P0.
- [ ] App diterima App Store + Play Store.
- [ ] Sentry, PostHog, EAS Update operasional.
- [ ] Runbook ops lengkap.
- [ ] Tim on-call schedule untuk minggu pertama public release.

---

## 19. Roadmap v2 (post-MVP)

| Feature | Justifikasi |
|---------|-------------|
| Quote repost rich preview | Engagement |
| Voice message DM | Diferensiasi |
| Video upload + transcode | User demand |
| Tools (Challenge Tracker, Profitability, Elliott Wave) | Parity dengan web |
| Follow system | Sosial graph |
| Group DM | Komunitas micro |
| WebSocket DM realtime | Latency |
| Tablet layout | iPad/Galaxy Tab user |
| Apple Sign In + Google Sign In | Alternative login |
| App Clip (iOS) / Instant App (Android) | Acquisition |
| Widget (iOS) / Live Activity | Market rail di home screen |
| Wear OS / watchOS | Notification only |
| Mirror feature: schedule post | Power user |
| AI assistant integration | Diferensiasi |

---

## 20. Timeline kasaran (tanpa estimasi waktu detail)

| Fase | Berisi |
|------|--------|
| **Fase 0 — Foundation** | Epic A + B + setup store accounts |
| **Fase 1 — Auth** | Epic C (bergantung backend Epic A) |
| **Fase 2 — Social Core** | Epic D + E + F (bergantung backend Epic B) |
| **Fase 3 — Polish** | Epic G + H + I (bergantung backend Epic C) |
| **Fase 4 — Beta** | Epic J internal + closed |
| **Fase 5 — Public** | Epic J submit + Epic K |

Path kritis: Epic A backend → Epic C mobile → Epic B backend → Epic D+E+F mobile → Beta → Public.

---

## 21. Lampiran

### 21.1 ENV file template `apps/mobile/.env.example`

```
# Build-time
APP_ENV=development
API_BASE_URL=https://hertz.cloudnexify.com
SENTRY_DSN=
POSTHOG_KEY=
POSTHOG_HOST=https://app.posthog.com
EXPO_PROJECT_ID=

# Runtime (extra di app.config.ts)
# (semua diatas + secrets per profile EAS)
```

### 21.2 `app.config.ts` ringkas

```ts
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: process.env.APP_ENV === 'production' ? 'Hertz' : `Hertz (${process.env.APP_ENV})`,
  slug: 'hertz-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'hertz',
  userInterfaceStyle: 'automatic',
  splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: '#0a0a0f' },
  ios: {
    bundleIdentifier: 'com.hertz.app',
    associatedDomains: ['applinks:hertz.cloudnexify.com'],
    supportsTablet: false,
    infoPlist: {
      LSApplicationQueriesSchemes: ['tg', 'telegram'],
      NSPhotoLibraryUsageDescription: 'Pilih foto untuk post atau DM.',
      NSCameraUsageDescription: 'Ambil foto untuk post atau DM.',
    },
  },
  android: {
    package: 'com.hertz.app',
    versionCode: 1,
    permissions: ['NOTIFICATIONS', 'CAMERA', 'READ_MEDIA_IMAGES'],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: 'hertz.cloudnexify.com', pathPrefix: '/auth/callback' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  extra: {
    apiBaseUrl: process.env.API_BASE_URL,
    sentryDsn: process.env.SENTRY_DSN,
    posthogKey: process.env.POSTHOG_KEY,
    appEnv: process.env.APP_ENV,
    eas: { projectId: process.env.EXPO_PROJECT_ID },
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    ['expo-image-picker', { photosPermission: 'Pilih foto untuk post atau DM.' }],
    ['expo-notifications', { icon: './assets/notification-icon.png', color: '#13d27b' }],
    'sentry-expo',
  ],
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID}` },
});
```

### 21.3 `eas.json`

```json
{
  "cli": { "version": ">= 7.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development", "API_BASE_URL": "https://hertz.cloudnexify.com" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "APP_ENV": "preview", "API_BASE_URL": "https://hertz.cloudnexify.com" },
      "ios": { "simulator": false }
    },
    "production": {
      "channel": "production",
      "env": { "APP_ENV": "production", "API_BASE_URL": "https://hertz.cloudnexify.com" },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "ops@hertz.cloudnexify.com", "ascAppId": "TBD", "appleTeamId": "TBD" },
      "android": { "serviceAccountKeyPath": "./play-service-account.json", "track": "internal" }
    }
  }
}
```

### 21.4 ApiClient sketch

```ts
// src/api/client.ts
import ky, { HTTPError } from 'ky';
import { env } from '@/lib/env';
import { secureStore } from '@/auth/secureStore';
import { authStore } from '@/auth/store';
import * as Application from 'expo-application';

export const api = ky.create({
  prefixUrl: `${env.API_BASE_URL}/api/mobile/v1`,
  timeout: 15000,
  retry: { limit: 1, methods: ['get'] },
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await secureStore.getToken();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
        request.headers.set('X-Request-ID', crypto.randomUUID());
        request.headers.set('App-Version', Application.nativeApplicationVersion ?? '0.0.0');
        request.headers.set('App-Platform', Platform.OS);
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401) {
          await authStore.logout(true /* triggered by 401 */);
        }
        if (response.status === 426) {
          await authStore.showUpgradeRequired();
        }
      },
    ],
  },
});

export async function apiGet<T>(path: string): Promise<T> {
  const data = await api.get(path).json<{ success: boolean; data: T; error?: any }>();
  if (!data.success) throw new ApiError(data.error);
  return data.data;
}
// apiPost, apiPatch, apiDelete serupa
```

### 21.5 Glossary mobile-specific

- **TestFlight** — Distribusi beta iOS (Apple).
- **Play Console** — Distribusi Android (Google).
- **EAS Build** — Cloud build service Expo.
- **EAS Update** — OTA JS bundle update.
- **Expo Push Service** — Layanan push notif Expo (proxy ke APNs/FCM).
- **FlashList** — High-perf list dari Shopify (drop-in FlatList replacement).
- **Reanimated** — Library animasi RN (UI thread).

---

## 22. Sign-off

| Reviewer | Role | Status |
|----------|------|--------|
| _____ | Mobile Lead | [ ] |
| _____ | Backend Lead (kontrak) | [ ] |
| _____ | Product | [ ] |
| _____ | Design | [ ] |
| _____ | DevOps | [ ] |

Setelah sign-off Epic A boleh dimulai paralel dengan Backend Epic A.

---

Berikutnya: kick-off Backend Epic A (`prd-backend-mobile-api.md` §5) + Mobile Epic A (§6 di atas).
