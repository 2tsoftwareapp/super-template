# Mobile

Flutter client for Super Template.

## Application identifier

Android `namespace` / `applicationId` and the iOS `PRODUCT_BUNDLE_IDENTIFIER`
ship as `com.example.mobile_app` / `com.example.mobileApp`. Rebranding rewrites
both:

```bash
node scripts/rename.mjs "Acme App" --author acme-co   # -> com.acmeapp.app
```

The rule is `com.<project name folded to lowercase alphanumerics>.app` (spaces
and punctuation dropped, diacritics folded, an `app` prefix if the name would
start with a digit). The same value is used for both platforms. It is applied in
`android/app/build.gradle.kts`, `android/app/src/main/kotlin/`,
`ios/Runner.xcodeproj/project.pbxproj` (including `.RunnerTests`), `Info.plist`,
and the `google-services.json` / `GoogleService-Info.plist` templates. Register
the same identifier in Firebase when you enable push.

## Release signing

Android release builds are signed with the **debug** keystore out of the box so
`flutter run --release` works. Google Play rejects that, so a real release needs
a keystore that only the project owner can create — this repository cannot ship
one. Steps:

1. Create the keystore (keep it and its passwords out of git):

   ```bash
   keytool -genkey -v -keystore ~/upload-keystore.jks \
     -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```

2. Create `apps/mobile/android/key.properties` (gitignored) with:

   ```properties
   storePassword=<password>
   keyPassword=<password>
   keyAlias=upload
   storeFile=/absolute/path/to/upload-keystore.jks
   ```

3. In `apps/mobile/android/app/build.gradle.kts`, load it and add a release
   signing config, then point `buildTypes.release` at it:

   ```kotlin
   import java.util.Properties
   import java.io.FileInputStream

   val keystoreProperties = Properties().apply {
       val file = rootProject.file("key.properties")
       if (file.exists()) FileInputStream(file).use { load(it) }
   }

   android {
       signingConfigs {
           create("release") {
               keyAlias = keystoreProperties["keyAlias"] as String
               keyPassword = keystoreProperties["keyPassword"] as String
               storeFile = file(keystoreProperties["storeFile"] as String)
               storePassword = keystoreProperties["storePassword"] as String
           }
       }
       buildTypes {
           release {
               signingConfig = signingConfigs.getByName("release")
           }
       }
   }
   ```

4. Verify: `flutter build appbundle --release`, then check the signer with
   `keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab`.

Keep a copy of the keystore and passwords outside the repository — losing them
means you cannot ship an update to the same listing.

## Run

- `make dev-mobile` launches the app with `apps/mobile/env/dev.json`
- `make test-mobile` runs the Flutter test suite
- `make generate` refreshes the generated API client before Flutter codegen
- `pnpm run mobile:doctor` checks Flutter/Dart and runs `flutter doctor`
- `pnpm run mobile:setup` runs `flutter pub get`
- `pnpm run mobile:dev` launches the app without relying on Make/bash
- `pnpm run mobile:format-check` validates Dart formatting without rewriting files

## Windows / PowerShell

If you are on a Windows company PC, use the root mobile scripts instead of shell-specific commands:

```powershell
pnpm run mobile:doctor
pnpm run mobile:setup
pnpm run mobile:dev
pnpm run mobile:test
```

If Flutter is not installed yet, `mobile:doctor` fails early with the expected next step instead of dropping you into a deeper Make/bash error.

## Environment Files

- `apps/mobile/env/dev.json`
- `apps/mobile/env/staging.json`
- `apps/mobile/env/prod.json`

## Networking

- iOS simulator: `http://localhost:3001` (base URL; generated client adds `/api/v1`)
- Android emulator: `AppConfig` rewrites `localhost` / `127.0.0.1` to `10.0.2.2` automatically
- physical device: use the host machine LAN IP in `apps/mobile/env/dev.json`

## Generated Client

The generated Dart API client lives in `lib/generated/api`.
It is produced from the API OpenAPI document by `make generate`.

## Feature Matrix

| Route | Permission | API |
| --- | --- | --- |
| `/login` | public | `AuthApi.login` |
| `/register` | public | `AuthApi.register` |
| `/forgot-password` | public | `AuthApi.forgotPassword` |
| `/verify-email` | public | `AuthApi.verifyEmail` |
| `/reset-password` | public | `AuthApi.resetPassword` |
| `/home` | authenticated | — |
| `/notifications` | `notifications.read` | `NotificationsApi.list` |
| `/profile` | authenticated | `AuthApi.getMe` |
| `/preferences` | authenticated | `UsersApi.preferences` |
| `/security` | authenticated | `AuthApi.changePassword` |
| `/sessions` | authenticated | `AuthApi.getSessions` |
| `/organizations` | authenticated | `OrganizationsApi.list/create` |
| `/imports` | `imports.manage` | `ImportsApi` + `FilesApi.upload` |
| `/exports` | `exports.manage` | `ExportsApi` + `FilesApi.getUrl` |
| `/admin` | any admin permission | hub |
| `/admin/users` | `users.read` | `AdminUsersApi` |
| `/admin/roles` | `roles.read` | `AdminRolesApi` |
| `/admin/jobs` | `jobs.read` | `AdminJobsApi` |
| `/admin/mail` | `mail.read` | `AdminMailApi` |
| `/admin/settings` | `settings.read` | `AdminSettingsApi` |
| `/admin/notifications` | `notifications.send` | `AdminNotificationsApi` |
| `/admin/audit-logs` | `audit.read` | `AdminAuditApi` |

## Push Notifications (FCM)

FCM is **optional**. Without Firebase config the app still works; inbox and SSE-backed flows are unchanged. When configured, the app registers the device token on login and unregisters on logout via `NotificationsApi.registerDevice`. Foreground messages show a snackbar with a shortcut to `/notifications`.

Web notifications use **SSE**, not Firebase. Firebase is for **mobile push only**.

### 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project (or use an existing one).
2. Register an **Android** app with package name `com.example.mobile_app` (must match `applicationId` in `android/app/build.gradle.kts`).
3. Download `google-services.json` and place it at:

   `android/app/google-services.json`

   Or copy the template and fill in your values:

   ```bash
   cp android/app/google-services.json.example android/app/google-services.json
   ```

4. **iOS (optional):** register an iOS app, download `GoogleService-Info.plist`, and place it at:

   `ios/Runner/GoogleService-Info.plist`

   Template: `ios/Runner/GoogleService-Info.plist.example`

These files are **gitignored**. Commit only the `*.example` templates. The Google Services Gradle plugin is applied automatically when `google-services.json` exists.

### 2. API credentials (server-side FCM)

The NestJS API sends push via Firebase Admin SDK. In the monorepo root `.env`:

```env
FCM_PROJECT_ID=your-firebase-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Generate a service account key: Firebase Console → Project settings → Service accounts → **Generate new private key**.

Map fields from the downloaded JSON (`project_id`, `client_email`, `private_key`). Newlines in `FCM_PRIVATE_KEY` must be escaped as `\n` inside the quoted string.

### 3. Run and verify

```bash
make db-migrate
make dev-api          # API with FCM_* in .env
make dev-mobile       # Flutter with google-services.json in place
```

After login, the app calls `POST /api/v1/notifications/devices` with the FCM token. Send a test push from the admin API (`POST /api/v1/admin/notifications`) or Firebase Console.
