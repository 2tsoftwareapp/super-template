# Firebase Demo — Super Template (Mobile)

Firebase project demo dùng cho **FCM push trên mobile app** (Flutter/Android/iOS).

**Web app không dùng Firebase** — realtime notifications qua **SSE** (`GET /api/notifications/stream` qua BFF).

## Thông tin project

| Field | Value |
|-------|-------|
| **Project ID** | `super-template-demo` |
| **Project Number** | `421790654112` |
| **Console** | https://console.firebase.google.com/project/super-template-demo |

### Apps đã đăng ký

| Platform | App ID | Ghi chú |
|----------|--------|---------|
| Android | `1:421790654112:android:abaf904e4c5485878873c5` | `com.example.mobile_app` |

Config Android: `config/google-services.json`

## Quick start

### 1. Link config vào Flutter app

```bash
./scripts/link-configs.sh
```

Copy `config/google-services.json` → `apps/mobile/android/app/google-services.json`

### 2. Service Account cho API (FCM server)

Backend NestJS gửi push qua **Firebase Admin SDK**:

1. [Project Settings → Service accounts](https://console.firebase.google.com/project/super-template-demo/settings/serviceaccounts/adminsdk)
2. **Generate new private key** → tải JSON
3. Map vào `.env` root monorepo:

```env
FCM_PROJECT_ID=super-template-demo
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@super-template-demo.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

```bash
./scripts/print-fcm-env.sh ~/.secrets/super-template-demo-firebase-adminsdk.json
```

### 3. Chạy stack

```bash
make db-migrate
make dev          # API + Web (SSE)
make dev-mobile   # Flutter
```

### 4. Đăng ký FCM token (mobile)

```http
POST /api/v1/notifications/devices
{ "token": "<fcm-token>", "platform": "ANDROID" }
```

### 5. Gửi thử push

```bash
curl -X POST http://localhost:3001/api/v1/admin/notifications \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "USER",
    "userId": "<uuid>",
    "type": "demo.push",
    "title": "Firebase demo",
    "body": "Hello from mobile FCM"
  }'
```

## Luồng notifications

```mermaid
flowchart LR
  Admin[Admin API send] --> API[NestJS API]
  API --> DB[(PostgreSQL inbox)]
  API --> SSE[Web SSE]
  API --> FCM[Firebase Admin SDK]
  SSE --> Web[Next.js EventSource]
  FCM --> Mobile[Flutter FCM]
```

| Client | Realtime | Inbox |
|--------|----------|-------|
| **Web** | SSE | `GET /notifications` |
| **Mobile** | FCM push | `GET /notifications` |

## Cấu trúc

```text
examples/firebase-demo/
├── .firebaserc
├── firebase.json
├── config/google-services.json
├── scripts/
│   ├── link-configs.sh
│   └── print-fcm-env.sh
└── README.md
```

## Thêm iOS (tuỳ chọn)

```bash
npx -y firebase-tools@latest apps:create ios com.example.mobileApp \
  --project super-template-demo
```
