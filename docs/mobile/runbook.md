# Mobile Backend Runbook

## Env checklist (production)

| Variable | Required | Notes |
|----------|----------|-------|
| `TELEGRAM_BOT_TOKEN` | Yes | Handoff HMAC verify |
| `HERTZ_MEMBERSHIP_GROUP_ID` | Yes | Membership gate |
| `MEMBER_SESSION_SECRET` | Yes | Bearer token hashing |
| `REDIS_URL` | Yes | Rate limit, typing, push debounce, optional read cache |
| `PUSH_PROVIDER` | Yes | `expo` (default) or `fcm_http_v1` |
| `EXPO_ACCESS_TOKEN` | Recommended | Expo push receipts |
| `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` | If FCM v1 | Native token delivery |
| `MOBILE_DEEP_LINK_SCHEME` | Yes | Default `hertz` |
| `MOBILE_APP_BUNDLE_ID_IOS` | Recommended | Universal Links |
| `MOBILE_APP_PACKAGE_ANDROID` | Recommended | App Links |
| `MOBILE_MIN_APP_VERSION` | Optional | Returns 426 when App-Version too low |
| `MOBILE_READ_CACHE` | Optional | Set `1` to enable 60s Redis/in-memory read cache |
| `R2_*` | Yes | Media upload + presigned URLs |
| `GLOBALDATA_API_URL` | Recommended | Market rail data |

## Deploy

1. Pull latest `main`
2. Run `npm run test:ci` and `npm run build:frontend`
3. Deploy via existing VPS workflow (`deploy-docker.sh`)
4. Verify health:

```bash
curl -sS "$BASE/api/mobile/v1/market/rail" -H 'App-Version: 1.0.0' | jq '.success'
```

## Smoke tests

```bash
# Handoff init (public)
curl -sS -X POST "$BASE/api/mobile/v1/auth/handoff/init" \
  -H 'Content-Type: application/json' \
  -H 'App-Version: 1.0.0' \
  -d '{"deviceId":"smoke-device","platform":"ios","appVersion":"1.0.0"}' | jq

# Authenticated /me
curl -sS "$BASE/api/mobile/v1/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'App-Version: 1.0.0' | jq '.data.user.id'

# Push register
curl -sS -X POST "$BASE/api/mobile/v1/notifications/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'App-Version: 1.0.0' \
  -H 'Content-Type: application/json' \
  -d '{"platform":"expo","token":"ExponentPushToken[smoke]","deviceId":"smoke-device"}' | jq
```

## Logs

Structured JSON logs include `requestId`, `route`, `status`, `latencyMs`:

```bash
docker logs hertz-frontend 2>&1 | jq 'select(.requestId != null)'
```

## Rollback

Revert to previous image/commit. Mobile routes are additive; rollback is safe for web traffic.

## Regenerate OpenAPI

```bash
node scripts/generate-mobile-openapi.mjs
```
