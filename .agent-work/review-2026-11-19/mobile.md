# Flutter mobile app review — apps/mobile

Date: 2026-11-19
Scope: `apps/mobile` (384 Dart files), `packages/mobile_core`, `packages/feature_identity_mobile`,
`packages/feature_platform_mobile`, plus `android/` and `ios/` project config.
Method: static reading + `rg`/`find`. No `flutter pub get`, no build, no analyzer, no test run
(Flutter/Dart toolchain not assumed available — see "Not verified").

Counts: **P0 0 · P1 2 · P2 7 · P3 1**

---

## P1-1 — Android dev builds cannot reach the API: cleartext HTTP is blocked

**Location** `apps/mobile/android/app/src/main/AndroidManifest.xml:2-5` (no cleartext opt-in),
`apps/mobile/env/dev.json:3`

**Evidence**
```json
// apps/mobile/env/dev.json:2-3
  "APP_ENV": "development",
  "API_BASE_URL": "http://localhost:3001"
```
```xml
<!-- apps/mobile/android/app/src/main/AndroidManifest.xml:2-5 -->
    <application
        android:label="mobile_app"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
```
`rg 'usesCleartextTraffic|networkSecurityConfig|NSAllowsArbitraryLoads' android ios` → **no matches**;
`android/app/src/main/res/` contains no `xml/` directory. `android/app/build.gradle.kts:29` uses
`targetSdk = flutter.targetSdkVersion`, i.e. API 35+ for the pinned SDK (`pubspec.yaml` `sdk: ^3.12.2`).

**Impact**
`make dev-mobile` → `flutter run --dart-define-from-file=env/dev.json` (`scripts/mobile.sh:130`) sets
`API_BASE_URL=http://localhost:3001`, which `AppConfig.resolveApiBaseUrl` rewrites to
`http://10.0.2.2:3001` on Android (`packages/mobile_core/lib/src/config/app_config.dart:50-51`).
Since API 28, Android blocks cleartext by default, so every Dio call fails with
`CLEARTEXT communication to 10.0.2.2 not permitted by network security policy`. The documented
primary developer flow (README "Networking", "make dev-mobile") is broken on the Android emulator,
and with a LAN IP (README:114) on a physical device too.

**Fix**
Add `android/app/src/debug/res/xml/network_security_config.xml` permitting cleartext only for
`10.0.2.2` and `localhost`, and reference it from a debug-only manifest overlay
(`<application android:networkSecurityConfig="@xml/network_security_config">` in
`src/debug/AndroidManifest.xml`). Leave the release manifest strict.

---

## P1-2 — Release builds are signed with the public debug keystore

**Location** `apps/mobile/android/app/build.gradle.kts:34-40`

**Evidence**
```kotlin
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
```

**Impact**
`flutter build appbundle --release` produces an artifact Play Console rejects, and any APK is signed
with the AOSP debug key (same key on every machine, password `android`). For a sideloaded/internal
distribution channel, a third party can sign an update that the installed app will accept — the
signature check that protects app updates is defeated. README:25-27 acknowledges the Play rejection
but the Gradle build has no guard, so a release artifact is emitted silently.

**Fix**
Read `key.properties` (already gitignored via `android/.gitignore:12`) into a `release` signingConfig
and make the build fail with a clear message when it is absent, instead of falling back to `debug`.

---

## P2-1 — The auth-gate tests do not exercise production code

**Location** `apps/mobile/test/router_redirect_test.dart:3-16`, `apps/mobile/test/login_validation_test.dart:3-5`

**Evidence**
```dart
// test/router_redirect_test.dart:3-8
// Pure function mirroring the redirect logic in router.dart.
String? resolveRedirect({
  required bool isAuthenticated,
  required bool isLoading,
  required String location,
}) {
```
```dart
// test/login_validation_test.dart:3-5
bool isValidLogin(String email, String password) {
  return email.contains('@') && password.length >= 8;
}
```
`rg 'isValidLogin' lib` → no matches: the function exists only inside the test file. The redirect
test also re-declares its own `publicRoutes` set (lines 9-16) instead of importing
`IdentityRoutes`, and lines 49-68 contain two tests with identical bodies under different names.

**Impact**
The single most security-relevant branch in the app — `router.dart:47-66`, which decides whether an
unauthenticated user can reach a protected route — has no real coverage. Any drift in
`router.dart` (a route dropped from `_publicRoutes`, an inverted condition) keeps the suite green.

**Fix**
Move the redirect predicate into a testable pure function in `lib/` and import it from the test
(delete the local copy); have the login test call the validator the screen actually uses.

---

## P2-2 — GoRouter is recreated on every auth-state emission; org switch throws the user to /splash

**Location** `apps/mobile/lib/app/router.dart:41-43`, `apps/mobile/lib/features/auth/presentation/auth_controller.dart:74-85`

**Evidence**
```dart
// lib/app/router.dart:41-44
final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
```
```dart
// lib/features/auth/presentation/auth_controller.dart:80-85
  Future<void> refreshSession() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(authRepositoryProvider).restoreSession(),
    );
  }
```
`router.dart:53-55` redirects every non-splash location to `/splash` while `isLoading` is true.

**Impact**
`ref.watch(authControllerProvider)` makes the `GoRouter` instance itself a function of auth state, so
login, logout, refresh and `switchOrganization` all construct a new router (new navigator keys, empty
`StatefulShellBranch` back stacks). `switchOrganization` (`auth_controller.dart:74-78`) awaits
`refreshSession()`, which sets `AsyncLoading` → the user is bounced from `/organizations/:id` to
`/splash` and then to `/home`, losing the screen they were on.

**Fix**
Create the router once and let auth changes re-run `redirect` via `refreshListenable` /
`GoRouter.notifyListeners`; avoid a global `AsyncLoading` state for a background session refresh
(use a separate flag or keep the previous session value).

---

## P2-3 — verify-email / reset-password / invite deep links can never resolve

**Location** `apps/mobile/lib/core/deep_links/deep_link_listener.dart:77-101`, `apps/mobile/android/app/src/main/AndroidManifest.xml:31-32`

**Evidence**
```dart
// lib/core/deep_links/deep_link_listener.dart:77-81
  String? _mapUriToPath(Uri uri) {
    final segments = uri.pathSegments;
    if (segments.isEmpty) {
      return null;
    }
```
```xml
<!-- android/app/src/main/AndroidManifest.xml:31-32 -->
                <data android:scheme="myapp" android:host="sso" android:path="/callback"/>
                <data android:scheme="super-template" android:host="sso" android:path="/callback"/>
```

**Impact**
For `myapp://verify-email?token=…`, `verify-email` is the URI **host**, so `pathSegments` is empty and
`_mapUriToPath` returns `null` → the link is silently dropped (same for `reset-password`, `invite`,
`organizations`; the `case 'invite'` branch at 92-96 is unreachable for these URIs). On Android the
registered intent filter only matches host `sso`, so those links never even open the app. Result:
email-verification and password-reset links do nothing on a device.

**Fix**
Resolve the first route segment from `uri.host` when `pathSegments` is empty (or normalise to
`myapp:///<path>`), and register matching `<data>` entries / use a single https App Link host with a
path prefix.

---

## P2-4 — SSO callback failure is an unhandled async error with no user feedback; listener never cancelled

**Location** `apps/mobile/lib/core/deep_links/deep_link_listener.dart:24, 70`

**Evidence**
```dart
// lib/core/deep_links/deep_link_listener.dart:70-74
    await ref.read(authRepositoryProvider).completeSsoExchange(exchangeCode);
    if (mounted) {
      context.go('/home');
    }
    return true;
```
`completeSsoExchange` throws `AppException` on a Dio failure (`auth_repository.dart:282-284`) and on a
malformed payload (`:276-278`). The callback is fed from `_appLinks.uriLinkStream.listen(_navigateFromUri)`
(line 24) with no `onError`.

**Impact**
A network error or expired exchange code while returning from the browser produces an uncaught
zone error: the user lands back on the login screen with no message and no way to tell whether SSO
worked. The `StreamSubscription` is never stored or cancelled in `dispose()`, so the listener keeps
`ref.read`-ing after the widget is unmounted.

**Fix**
Wrap the exchange in try/catch and surface the failure (snackbar + stay on login); keep the
`StreamSubscription` in a field, pass `onError`, and `cancel()` it in `dispose()`.

---

## P2-5 — Notification list diverges from the server and can trip the Dismissible assertion

**Location** `apps/mobile/lib/features/notifications/presentation/notifications_screen.dart:63-81, 89-96`

**Evidence**
```dart
// lib/features/notifications/presentation/notifications_screen.dart:72-81
              onDismissed: (_) async {
                try {
                  await repository.delete(item.id);
                  ref
                    ..invalidate(notificationsListProvider)
                    ..invalidate(unreadNotificationsProvider);
                } catch (e) {
```

**Impact**
The row is removed by the dismiss animation *before* the DELETE completes and the list is only
invalidated on success. If the DELETE fails, the notification stays on the server but is gone from the
UI until a manual refresh, and while the request is in flight the dismissed child is still present in
the rebuilt list, which trips Flutter's "A dismissed Dismissible widget is still part of the tree"
assertion. Separately, `onTap` at line 91 (`await repository.markRead(item.id)`) has no try/catch, so
a read-marker failure is an unhandled async error with no feedback.

**Fix**
Use `confirmDismiss` to `await repository.delete(...)` and return `true` only on success (then
invalidate); wrap `markRead` in try/catch with a snackbar.

---

## P2-6 — A valid session is discarded on any transient network error at cold start

**Location** `apps/mobile/lib/features/auth/data/auth_repository.dart:54-67`

**Evidence**
```dart
    } on DioException catch (error) {
      final statusCode = error.response?.statusCode;

      if (statusCode == 401) {
        await _storage.clear();
        return null;
      }

      // Network error / timeout / 5xx: keep tokens so the user can retry
      // after connectivity is restored. Return null to skip straight to login
      // UI without an error dialog.
      return null;
```

**Impact**
`AuthController.build` (`auth_controller.dart:17-23`) turns that `null` into "unauthenticated", and
`router.dart:57-60` sends the user to `/login`. A user launching the app offline or during a backend
5xx therefore sees a login form despite holding a valid refresh token; the comment's promised "retry
after connectivity is restored" has no UI, and the only way forward — retyping credentials —
overwrites the tokens.

**Fix**
Separate transport failures from real auth rejection: expose an error/retry state (splash with
"Retry") when `DioExceptionType.connectionError`/`connectionTimeout`/5xx occurs and tokens exist,
and only clear on 401.

---

## P2-7 — iOS project is pinned to the template author's Apple team

**Location** `apps/mobile/ios/Runner.xcodeproj/project.pbxproj:488` (also `:671`, `:694`)

**Evidence**
```
				DEVELOPMENT_TEAM = ZG4LJ9HHX8;
```
`scripts/rename.mjs` rewrites `PRODUCT_BUNDLE_IDENTIFIER` (see its header comment, line 16) but never
touches `DEVELOPMENT_TEAM`.

**Impact**
Any developer who is not in team `ZG4LJ9HHX8` cannot build for a device or archive: Xcode fails with
"No signing certificate / No profiles for 'com.example.mobileApp'". The original author's team
identifier is also committed into a distributable template.

**Fix**
Remove `DEVELOPMENT_TEAM` from the committed pbxproj (let each developer set it locally, or read it
from an untracked `Local.xcconfig`) and add a script check that greps for the placeholder team id.

---

## P3-1 — Every HTTP request performs two keystore reads

**Location** `apps/mobile/lib/core/network/auth_interceptor.dart:33-37`, `packages/mobile_core/lib/src/auth/token_storage.dart:12-18`

**Evidence**
```dart
    final tokens = await _ref.read(tokenStorageProvider).read();
    if (tokens != null) {
      options.headers['authorization'] = 'Bearer ${tokens.accessToken}';
    }
    handler.next(options);
```
`TokenStorage.read()` issues two sequential `_store.read(...)` calls (access + refresh) with no
in-memory cache; each is a platform-channel round-trip plus Keychain/Keystore decryption.

**Impact**
Adds two crypto round-trips to the critical path of every API call, serially, including the fan-out
on the home screen (activities + notifications + organizations).

**Fix**
Cache the `TokenBundle` in `TokenStorage` (write-through on `write`, clear on `clear`) and read from
the cache in the interceptor.

---

## Not verified / out of reach

- No `flutter analyze`, `flutter test`, `dart format --set-exit-if-changed`, or build was run; the
  environment assumption is that Dart/Flutter tooling and `.dart_tool` are absent. Type errors,
  analyzer findings and the true test-suite result are therefore unknown.
- The `--dart-define-from-file` path was confirmed by reading `scripts/mobile.sh:130` and
  `apps/mobile/README.md`, not by executing the app.
- Android cleartext behaviour is asserted from the platform contract (targetSdk ≥ 28 blocks cleartext
  unless opted in) and from the absence of any opt-in in the repo; it was not reproduced on a device.
- iOS ATS behaviour for `http://localhost` was **not** assessed — `Info.plist` has no
  `NSAppTransportSecurity` block, and whether loopback is exempt was not verified.
- No credential/token leakage was found: tokens live in `flutter_secure_storage`
  (`packages/mobile_core/lib/src/storage/secure_store.dart:26-28`), `SharedPreferences` is used only
  for the theme (`theme_store.dart:9`), and `rg 'print\(|debugPrint\('` over `lib/` finds no logging.
- `packages/feature_identity_mobile` and `packages/feature_platform_mobile` contain only route
  constants; no defects there.
- API-contract drift: the generated Dart client matches `packages/api-contract/src/generated/index.ts`
  for the DTOs sampled (`NotificationDto.readAt`, `ExchangeSsoSessionDto.code`). One gap is recorded
  in the delivery: `ssoControllerExchangeSession` is typed `Future<Response<void>>`
  (`lib/generated/api/lib/src/api/sso_api.dart:39`) although the server returns tokens, which is why
  `AuthRepository.completeSsoExchange` hand-rolls the POST (`auth_repository.dart:266-285`); the
  hand-rolled body shape matches the contract, so this is a contract *gap*, not current drift.
