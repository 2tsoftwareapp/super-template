# Mobile App

## Tổng quan (80/20)

- **Vai trò**: Mobile client iOS/Android — auth, projects, notifications, profile, organizations, admin panels.
- **Stack**: Flutter, Dart SDK ^3.12.2, Riverpod, go_router, Dio.
- **Scripts** (root-level): `mobile:doctor`, `mobile:setup`, `mobile:dev`, `mobile:test`, `mobile:analyze`, `mobile:format`

## Chi tiết

### Routes chính

`/login`, `/register`, `/home`, `/projects`, `/notifications`, `/admin/*`

### API Client

Generated Dart client từ OpenAPI spec — nằm ở `lib/generated/api/`. Sinh qua `make generate`.

### Config

Environment JSON files: `env/dev.json`, `env/staging.json`, `env/prod.json`

### Dependencies chính

`flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`, `built_value`/`built_collection`, `firebase_core` + `firebase_messaging`, `file_picker`, `url_launcher`

---

Nguồn: `apps/mobile/pubspec.yaml`, `apps/mobile/`
Last-synced: `8411838`
